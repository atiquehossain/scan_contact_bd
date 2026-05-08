"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, Phone, PhoneCall, PhoneOff, QrCode, ShieldCheck } from "lucide-react";
import { APP_NAME, apiFetch } from "@/lib/api";
import { contactContextTitle, safePublicLabel } from "@/lib/brand";
import { Button, InlineAlert, LoadingState } from "@/components/admin/ui";

type CallSession = {
  id: string;
  status: "RINGING" | "ACCEPTED" | "DECLINED" | "ENDED" | "EXPIRED" | "FAILED";
  scannerName?: string | null;
  tagLabel: string;
  expiresAt: string;
  createdAt: string;
  iceServers?: RTCIceServer[];
};

type CallSignal = {
  id: string;
  sender: "scanner" | "owner";
  type: string;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

function callIdFromLocation(fallback?: string) {
  if (typeof window === "undefined") return fallback || "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  const value = parts[0] === "call" ? parts[1] : fallback || "";
  return value && !value.startsWith("__") ? decodeURIComponent(value) : fallback || "";
}

function tokenFromLocation() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token") || "";
}

const fallbackIceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

function iceServersFor(callSession: CallSession | null): RTCIceServer[] {
  return callSession?.iceServers?.length ? callSession.iceServers : fallbackIceServers;
}

export function PublicCallClient({ callId: initialCallId }: { callId?: string }) {
  const [callId, setCallId] = useState(() => callIdFromLocation(initialCallId));
  const [token, setToken] = useState(() => tokenFromLocation());
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState("Loading private call...");
  const [error, setError] = useState("");
  const [secureContext, setSecureContext] = useState(true);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const processedSignalsRef = useRef(new Set<string>());
  const endedRef = useRef(false);

  useEffect(() => {
    setCallId(callIdFromLocation(initialCallId));
    setToken(tokenFromLocation());
  }, [initialCallId]);

  useEffect(() => {
    setSecureContext(window.isSecureContext);
  }, []);

  const loadCall = useCallback(async () => {
    if (!callId || !token) {
      setError("This private call link is incomplete. Please scan the QR again.");
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ callSession: CallSession }>(
        `/public/calls/${encodeURIComponent(callId)}?token=${encodeURIComponent(token)}`,
        {},
        ""
      );
      setCallSession(data.callSession);
      setStatus(statusCopy(data.callSession.status));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "This private call is no longer available.");
    } finally {
      setLoading(false);
    }
  }, [callId, token]);

  useEffect(() => {
    void loadCall();
  }, [loadCall]);

  async function postSignal(type: string, payload: RTCSessionDescriptionInit | RTCIceCandidateInit) {
    await apiFetch(
      `/public/calls/${encodeURIComponent(callId)}/signals`,
      {
        method: "POST",
        body: JSON.stringify({ token, type, payload })
      },
      ""
    );
  }

  async function startCall() {
    if (!callId || !token || started) return;
    setError("");
    setStarted(true);
    setStatus("Asking for microphone permission...");
    try {
      if (!window.isSecureContext) {
        throw new Error("Private audio calls need a secure HTTPS link. Please open this page using the secure ScanContact BD link.");
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support private voice calls.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      const peer = new RTCPeerConnection({
        iceServers: iceServersFor(callSession)
      });
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          void postSignal("candidate", event.candidate.toJSON()).catch(() => undefined);
        }
      };
      peer.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          void remoteAudioRef.current.play().catch(() => undefined);
        }
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") setStatus("Private call connected.");
        if (["failed", "disconnected"].includes(peer.connectionState)) setStatus("Connection interrupted. You can end and try again.");
      };
      const offer = await peer.createOffer({ offerToReceiveAudio: true });
      await peer.setLocalDescription(offer);
      await postSignal("offer", offer);
      setStatus("Ringing owner app...");
    } catch (err) {
      setStarted(false);
      setError(err instanceof Error ? err.message : "Could not access microphone.");
      cleanupPeer();
    }
  }

  async function pollSignals() {
    if (!callId || !token || !started || endedRef.current) return;
    try {
      const data = await apiFetch<{ callSession: CallSession; signals: CallSignal[] }>(
        `/public/calls/${encodeURIComponent(callId)}/signals?token=${encodeURIComponent(token)}`,
        {},
        ""
      );
      setCallSession(data.callSession);
      setStatus(statusCopy(data.callSession.status));
      if (["DECLINED", "ENDED", "EXPIRED", "FAILED"].includes(data.callSession.status)) {
        cleanupPeer();
        endedRef.current = true;
        return;
      }
      for (const signal of data.signals) {
        if (processedSignalsRef.current.has(signal.id)) continue;
        processedSignalsRef.current.add(signal.id);
        const peer = peerRef.current;
        if (!peer) continue;
        if (signal.type === "answer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
        }
        if (signal.type === "candidate") {
          await peer.addIceCandidate(new RTCIceCandidate(signal.payload as RTCIceCandidateInit));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Call update failed.");
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => void pollSignals(), 1000);
    return () => window.clearInterval(timer);
  });

  async function endCall() {
    endedRef.current = true;
    cleanupPeer();
    setStatus("Call ended.");
    try {
      await apiFetch(
        `/public/calls/${encodeURIComponent(callId)}/end`,
        { method: "POST", body: JSON.stringify({ token }) },
        ""
      );
    } catch {
      // The local call already ended. The backend cleanup job can expire stale calls.
    }
  }

  function cleanupPeer() {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }

  useEffect(() => cleanupPeer, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-page-bg)] px-4 py-6">
        <section className="mx-auto max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
          <LoadingState label="Loading private call..." />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] px-4 py-6">
      <section className="mx-auto max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 text-center shadow-[var(--shadow-card)]">
        <span
          className="relative mx-auto grid h-14 w-14 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          aria-hidden
        >
          <QrCode size={27} />
          <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-primary)] text-white ring-2 ring-white">
            <PhoneCall size={13} />
          </span>
          <span className="absolute -bottom-1 -left-1 grid h-6 w-6 place-items-center rounded-full bg-white text-[var(--color-primary)] ring-1 ring-[var(--color-border)]">
            <ShieldCheck size={13} />
          </span>
        </span>
        <p className="mt-4 text-lg font-extrabold text-[var(--color-ink)]">{APP_NAME}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-muted)]">Private calls without sharing phone numbers</p>

        {error ? (
          <div className="mt-5 text-left">
            <InlineAlert tone="warning">{error}</InlineAlert>
          </div>
        ) : null}

        {callSession ? (
          <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#f8fbf9] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">Private QR contact</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[var(--color-ink)]">{contactContextTitle(undefined, callSession.tagLabel)}</h1>
            <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">{status}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Your phone number stays hidden. {APP_NAME} connects this call privately through the QR contact link.
            </p>
            <p className="mt-3 inline-flex rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-bold text-[var(--color-muted)]">
              Tag: {safePublicLabel(callSession.tagLabel)}
            </p>
          </div>
        ) : null}

        {!secureContext ? (
          <div className="mt-5 text-left">
            <InlineAlert tone="warning" title="Secure connection required">
              Private audio calls need HTTPS to protect microphone access. Open this page using a secure ScanContact BD link to continue.
            </InlineAlert>
          </div>
        ) : null}

        <audio ref={remoteAudioRef} autoPlay playsInline />

        <div className="mt-6 grid gap-3">
          {!started && !endedRef.current ? (
            <Button onClick={startCall} disabled={!secureContext}>
              <Mic aria-hidden size={18} />
              Start private call
            </Button>
          ) : null}
          <Button variant="danger" onClick={endCall}>
            <PhoneOff aria-hidden size={18} />
            End call
          </Button>
          <Link
            href="/"
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--color-primary)]"
          >
            <Phone aria-hidden size={18} />
            Back to contact page
          </Link>
        </div>
      </section>
    </main>
  );
}

function statusCopy(status: CallSession["status"]) {
  switch (status) {
    case "RINGING":
      return "Ringing owner app...";
    case "ACCEPTED":
      return "Owner accepted. Connecting private audio...";
    case "DECLINED":
      return "Owner declined the call.";
    case "ENDED":
      return "Call ended.";
    case "EXPIRED":
      return "This private call expired. Please scan again.";
    case "FAILED":
      return "Call failed.";
    default:
      return "Private call active.";
  }
}
