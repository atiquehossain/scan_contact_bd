"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, LockKeyhole, Mic, Phone, PhoneCall, PhoneOff, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { BRAND_NAME } from "@/lib/brand";
import { contactContextTitle, safePublicLabel } from "@/lib/brand";
import { Button, InlineAlert, LoadingState, StatusBadge } from "@/components/admin/ui";

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

function isTerminalCall(status?: CallSession["status"]) {
  return Boolean(status && ["DECLINED", "ENDED", "EXPIRED", "FAILED"].includes(status));
}

function callStatusTone(status?: CallSession["status"]): "success" | "warning" | "danger" | "info" {
  if (status === "ACCEPTED") return "success";
  if (status === "DECLINED" || status === "FAILED" || status === "EXPIRED") return "danger";
  if (status === "ENDED") return "warning";
  return "info";
}

function callStateTitle({
  error,
  linkIncomplete,
  loading,
  secureContext,
  sessionStatus,
  started,
  status
}: {
  error: string;
  linkIncomplete: boolean;
  loading: boolean;
  secureContext: boolean;
  sessionStatus?: CallSession["status"];
  started: boolean;
  status: string;
}) {
  if (loading) return "Preparing private browser call...";
  if (linkIncomplete) return "This private call link is incomplete.";
  if (error) return "This call is unavailable right now.";
  if (!secureContext) return "Private browser calls require a secure connection.";
  if (status.toLowerCase().includes("microphone")) return "Allow microphone access to continue.";
  if (status.toLowerCase().includes("connected")) return "Connected";
  if (sessionStatus === "RINGING" && started) return "Waiting for the owner to answer.";
  if (sessionStatus === "ACCEPTED") return "Connecting through NoNumQR...";
  if (sessionStatus === "DECLINED") return "The owner declined the call.";
  if (sessionStatus === "ENDED") return "Call ended";
  if (sessionStatus === "EXPIRED") return "This private call expired.";
  if (sessionStatus === "FAILED") return "This call is unavailable right now.";
  return "Private browser call";
}

function callStateBody({
  error,
  linkIncomplete,
  loading,
  secureContext,
  sessionStatus,
  started,
  status
}: {
  error: string;
  linkIncomplete: boolean;
  loading: boolean;
  secureContext: boolean;
  sessionStatus?: CallSession["status"];
  started: boolean;
  status: string;
}) {
  if (loading) return "Checking the token-protected NoNumQR call link.";
  if (linkIncomplete) return "Please open the full private call link from the QR contact flow.";
  if (error) return "Open the full call link from the QR flow, or send a private message instead.";
  if (!secureContext) return "Microphone access is only available on HTTPS or secure local browser contexts.";
  if (status.toLowerCase().includes("microphone")) return "Your browser will ask for microphone permission before the call can start.";
  if (status.toLowerCase().includes("connected")) return "This call happens through NoNumQR. Phone numbers are not shown on this page.";
  if (sessionStatus === "RINGING" && started) return "Keep this page open while the owner app rings.";
  if (sessionStatus === "ACCEPTED") return "The owner accepted. Establishing private browser audio.";
  if (isTerminalCall(sessionStatus)) return "You can close this page or return to the QR contact page.";
  return "Microphone access is needed to continue.";
}

export function PublicCallClient({ callId: initialCallId }: { callId?: string }) {
  const [callId, setCallId] = useState(initialCallId || "");
  const [token, setToken] = useState("");
  const [routeReady, setRouteReady] = useState(false);
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
    setRouteReady(true);
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
    if (!routeReady) return;
    void loadCall();
  }, [loadCall, routeReady]);

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
        throw new Error("Private audio calls need a secure HTTPS link. Please open this page using the secure NoNumQR link.");
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

  const linkIncomplete = !callId || !token;
  const sessionStatus = callSession?.status;
  const terminal = isTerminalCall(sessionStatus) || endedRef.current;
  const activeCallVisual = Boolean(started && !terminal && !error);
  const stateTitle = callStateTitle({ error, linkIncomplete, loading, secureContext, sessionStatus, started, status });
  const stateBody = callStateBody({ error, linkIncomplete, loading, secureContext, sessionStatus, started, status });
  const badgeLabel = loading
    ? "Preparing"
    : linkIncomplete
      ? "Link incomplete"
      : error
        ? "Unavailable"
        : sessionStatus === "ACCEPTED" || status.toLowerCase().includes("connected")
          ? "Connected"
          : sessionStatus === "RINGING" && started
            ? "Ringing"
            : sessionStatus
          ? statusCopy(sessionStatus)
          : "Ready";
  const badgeTone = error || linkIncomplete ? "warning" : callStatusTone(sessionStatus);
  const canStartCall = Boolean(callSession && !started && !terminal && !error && secureContext);
  const canEndCall = Boolean(callSession && !terminal);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(250,248,255,0.92),rgba(248,250,252,0.98))] px-4 py-4 text-[var(--color-ink)] sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col gap-4">
        <header className="flex min-h-14 items-center justify-between rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white/90 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <ShieldCheck aria-hidden size={21} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--color-primary)]">{BRAND_NAME}</p>
              <p className="text-xs font-medium text-[var(--color-muted)]">Private browser call</p>
            </div>
          </div>
          <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
        </header>

        <section className="rounded-[var(--radius-card-lg)] border border-teal-200 bg-[var(--color-primary-soft)] p-4 text-sm leading-6 text-[var(--color-primary-hover)] shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <LockKeyhole aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold text-[var(--color-ink-strong)]">Your phone number is not shown on this page.</p>
              <p className="mt-1">The owner&apos;s phone number stays hidden.</p>
              <p className="mt-1">This call happens through NoNumQR. Microphone access is needed to continue.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-hero)] border border-[var(--color-border)] bg-white p-5 text-center shadow-[var(--shadow-card)]">
          <div className="relative mx-auto grid h-28 w-28 place-items-center">
            {activeCallVisual ? (
              <>
                <span className="absolute inset-0 rounded-full bg-[var(--color-primary-soft)] motion-safe:animate-ping" aria-hidden />
                <span className="absolute inset-4 rounded-full bg-[var(--color-primary-soft)]" aria-hidden />
              </>
            ) : null}
            <span
              className={`relative grid h-24 w-24 place-items-center rounded-full border shadow-[var(--shadow-card)] ${
                error || !secureContext || isTerminalCall(sessionStatus)
                  ? "border-amber-200 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
                  : "border-teal-200 bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              }`}
              aria-hidden
            >
              {loading ? <Loader2 className="h-9 w-9 animate-spin" /> : error || !secureContext ? <AlertTriangle size={36} /> : <PhoneCall size={36} />}
            </span>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-primary)]">Private browser call</p>
            <h1 className="mt-2 text-2xl font-bold leading-8 tracking-[-0.01em] text-[var(--color-ink-strong)]">{stateTitle}</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">{stateBody}</p>
          </div>

          {loading ? (
            <div className="mt-5 text-left">
              <LoadingState label="Loading private call..." />
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 text-left">
              <InlineAlert tone="warning">{error}</InlineAlert>
            </div>
          ) : null}

          {!secureContext ? (
            <div className="mt-5 text-left">
              <InlineAlert tone="warning" title="Secure connection required">
                Private browser calls require a secure connection. Open this page using a secure NoNumQR link to continue.
              </InlineAlert>
            </div>
          ) : null}

          {callSession ? (
            <div className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#f8fbf9] p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">QR contact context</p>
              <h2 className="mt-1 text-lg font-bold text-[var(--color-ink-strong)]">{contactContextTitle(undefined, callSession.tagLabel)}</h2>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] bg-white px-3 py-2">
                  <dt className="font-semibold text-[var(--color-muted)]">Tag</dt>
                  <dd className="text-right font-semibold text-[var(--color-ink)]">{safePublicLabel(callSession.tagLabel)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] bg-white px-3 py-2">
                  <dt className="font-semibold text-[var(--color-muted)]">Status</dt>
                  <dd className="text-right font-semibold text-[var(--color-ink)]">{status}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] bg-white px-3 py-2">
                  <dt className="font-semibold text-[var(--color-muted)]">Expires</dt>
                  <dd className="inline-flex items-center gap-1 text-right font-semibold text-[var(--color-ink)]">
                    <Clock3 aria-hidden size={14} />
                    {new Intl.DateTimeFormat("en-BD", { timeStyle: "short", dateStyle: "medium" }).format(new Date(callSession.expiresAt))}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <audio ref={remoteAudioRef} autoPlay playsInline />

          <div className="mt-6 grid gap-3">
            {canStartCall ? (
              <Button type="button" className="min-h-12" onClick={startCall}>
                <Mic aria-hidden size={18} />
                Start Private Call
              </Button>
            ) : null}
            {canEndCall ? (
              <Button type="button" className="min-h-12" variant="danger" onClick={endCall}>
                <PhoneOff aria-hidden size={18} />
                End Call
              </Button>
            ) : null}
            <Link
              href="/"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
            >
              <Phone aria-hidden size={18} />
              Back to contact page
            </Link>
          </div>
        </section>

        <section className="rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white/80 p-4 text-center text-xs leading-5 text-[var(--color-muted)] shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-center gap-2 font-semibold text-[var(--color-primary)]">
            <CheckCircle2 aria-hidden size={15} />
            No phone numbers shown
          </div>
          <p className="mt-1">This is a NoNumQR browser audio call, not a telephone carrier call.</p>
        </section>
      </div>
    </main>
  );
}

function statusCopy(status: CallSession["status"]) {
  switch (status) {
    case "RINGING":
      return "Waiting for the owner to answer.";
    case "ACCEPTED":
      return "Connecting through NoNumQR...";
    case "DECLINED":
      return "Owner declined the call.";
    case "ENDED":
      return "Call ended.";
    case "EXPIRED":
      return "This private call expired.";
    case "FAILED":
      return "This call is unavailable right now.";
    default:
      return "Private browser call active.";
  }
}
