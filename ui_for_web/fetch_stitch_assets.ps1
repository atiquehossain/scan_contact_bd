$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Join-Path $base "html"
$screenshotDir = Join-Path $base "screenshots"
$sourceManifestPath = Join-Path $base "screens-manifest.json"
$localManifestPath = Join-Path $base "screens-manifest.local.json"

New-Item -ItemType Directory -Force -Path $sourceDir, $screenshotDir | Out-Null

function Get-Slug {
    param([string]$Value)

    $slug = $Value.ToLowerInvariant()
    $slug = $slug -replace "[^a-z0-9]+", "-"
    $slug = $slug.Trim("-")
    if ([string]::IsNullOrWhiteSpace($slug)) {
        return "screen"
    }
    return $slug
}

$screens = @(
    @{
        index = 1
        title = "Private Call: Ended - NoNumQR"
        id = "223d5911b4214f15a2df2bd43a8d8fc3"
        deviceType = "MOBILE"
        width = 780
        height = 1768
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2ZhMWJmYTYzNzZlZTQxNzJhZGVlODRiY2VhZWE5NTk2EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ujZUkY0Nv2goLYoZD9dWKdUH9wpEgjIIXW_9kzHxJZvsMAGrsOr5hS8i6Pc-OkOzyy5y_zwQH1SuoMe7GiRzV97NzfmC2FurYzdPJr2VS__sngrTCHJNNLb6X3E868AzGMF5mLNRaqBU4BzcSAG9uVRKS7wfW1wmVrFEbL-YRwx4PodbYYZGYN1tyDQMi0FCFjYbiGHSAYiQT3qN9BEduYtzMr8iBuowA4bNx9QDSZZV8fDo1m_ml8dyRz1"
    }
    @{
        index = 2
        title = "A set of premium QR products for NoNumQR"
        id = "e62cac205c4a4fac9f83ae600d9ffb99"
        deviceType = "IMAGE"
        width = 1200
        height = 896
        htmlMime = ""
        htmlUrl = ""
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ugtXlgts4NAy0xH7Dz9bEpdruVc6uZjiR3qleMyqrRWslfWPz3PgxH07eZAt710HPXzAeJXwPfZL5a8eAScFD6cxcNU5LI7Qf6pfO0hFGEnidMF4nS1pFY_ypHlgeHwfi-qR_BVfUqdIdJL_2tREhMlIejKeRYoq7OJDgfxzKliMJJMc8XowdboBqv8yLVkZ5C5756TkAlASmrtraRDmhaJHR09ZKTjopfV4-Y_QpayJGfQqpE2SmZi8Ziz"
    }
    @{
        index = 3
        title = "Chat Loading & Empty States - NoNumQR"
        id = "85fd919a952d441e95d74f3dbec41110"
        deviceType = "MOBILE"
        width = 780
        height = 1768
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQxNzc3ZDJiZmM1YTQ2Mzc5Y2MzNzg0N2NjM2RkN2IyEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uixBPc7wU3pdoXjN4caYbOJ76KYIepTvF3p_lHa258JRiNZHBdDY8pvcBEE_uS23OO3gqzqI0xAGeU1b1ZiwjF2xFFSdl4So8nAJVpuHY6laPX9gtO9DBE2sw0Dr3Ji00gJxGxVNsKdbtKR7f9Cv5dVpP2xXdLHeU-tVXvx2vFHGLwvUuVeMq72sgw_iDduHEGcC3soOc-Sr57VrLdTnUDB2FZ8Ipr1LvNFbcFgRkfWuFKRBBZVCovEE5w"
    }
    @{
        index = 4
        title = "NoNumQR Product Detail - Car Sticker"
        id = "edb13eaeca394321a3013af7154acdb8"
        deviceType = "DESKTOP"
        width = 2560
        height = 2498
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzA3OTRmNjVhMDgzMzRhNDNiM2QzNGM5ODQ1NTIxMTI5EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uiHE6HvUtNjhDwBN71ESA2mnFVX0X5cTXlC4CqX6x41tXHAatXdFsvvDQxdevEquzfplsrPRzaHViaZI8x0Po5kdhg_5VPDA6iO9NPFd102k4_TEG03AOwk0n0DcoRtrZ3OEHDusRdpvNvJg3P0T4k7uWIST4DiyXnNINiJepkcoC-B_z5S--ebue9qhcVhfxxNqwrFnLmo5zafY1eWKjC-Y6G3-2j9btyu3xYzV42ERNAY3kZ72JnZ2nc"
    }
    @{
        index = 5
        title = "NoNumQR Privacy Icon Mark"
        id = "a03d9eb887194d78aa46b335c16ec8b4"
        deviceType = "ASSET"
        width = 100
        height = 100
        htmlMime = "image/svg+xml"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2JlMWUyMzM2YmQwNDQwYWNiMjY1ZjEwMGIzOTM1OGE0EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uir1RolRjKUqe4NI_PKPdNYoPWE59GQHSYFgjWYw7DnG0EbWq_fNq0FkohADV_Wb605bLpOFA1m_TUaGvgJWJsjA2qDMccwlVcHcKwJipbKvPRjlhLiF-c4oSNruSTo-ounUpduTjiodgSwvt0RMgDC9hBxpygmZyKijSWCirzuIv0xka-iAQ3N2LQz_HgIo7kDn7F6BsrIRvegrqLyUDIhdkZQf-1yoM5NwbtjR65VelsDbXoDgc1MPW5_"
    }
    @{
        index = 6
        title = "Private Call: Ringing - NoNumQR"
        id = "ef3cae3b97ab4221a7485ea5a9b4189b"
        deviceType = "MOBILE"
        width = 780
        height = 1768
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2VkODYyMzY5MzBlZDQ5N2E4ZTJiNjM2MTU5MDNiOWYwEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ujzDACl9RcznQMGULPGhaDXGy9s32BeNGdmcw3pim7D2Ih-PX33dtSeTBYKPlEXxms2XHHKD5GIS9RVV8ib4eOZz0vfKxHT9Ydl-9PrbonjwxO96fLl1Aq2w6qJ37MkbcsTrkB6ryViPoXTOsajxZyOCOABRwb2y07oBs75sP15kPsFrCgb7zTWB75aUcMAHUDJbVBf4m4oC2c6DnX58ZvDj-X6FOz1po99Oyoj6hitI0F2uuOBxT53CNu2"
    }
    @{
        index = 7
        title = "Order Success - NoNumQR"
        id = "4e56a1eadc3948f9837d59742f30512d"
        deviceType = "DESKTOP"
        width = 2560
        height = 3044
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU3N2E3ZmM0MmJlMTQ3N2E4YmRkYzU5MzY3ZTllZWJhEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ugwruKim7HQwZTXgSdlupcoPbW3I95834C5kWmzEcBpTuH1yzmD2g5plDULpMeznwm_h3QjOIbrmExIcjbCY1svzNruPsx-Ho5rWD9OaQYRYd8wdlAWxIyQ7vyy_KUF_o6gDXbEODnxPysVkdBlIZlf9MJPEhz8UeXj2MfaFCsYFsv_UTFx0JNAtK_3c2nG0ru8FyBhANgvtU6sP-MtrrO923D-esq40BSTAN2V9rjOko65NECYvRsQrvg"
    }
    @{
        index = 8
        title = "NoNumQR Wordmark Logo"
        id = "176e283de4a249ff809fa4ca824ea388"
        deviceType = "ASSET"
        width = 200
        height = 60
        htmlMime = "image/svg+xml"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzk5N2UzMmQwZTc5MDRhYTdhMTYyYmIxNTk4MDM4ZGVmEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uj4RwNopkz00F-j2j_2phk7laXB166o8_cSFy4a3BzwaChS50DqbGwqLSSm76fRsEZiaRafqPggVFcZgxcfdiRxzYfVXanIUIZWZGnFIpyfxcIYTgH3aDfj89ws_wI9K3NnaOs3UhmFh64HVh7k9tSXCye-xQbTAqEKNW6cBP6EKKJ8QK5AYG9c00XWnQUshbrHQUSOD5rQ4sLtSzGR6sHjXrq2xqhnyMoM7nuTsb7T0EAjXiFHVcvxQwr-"
    }
    @{
        index = 9
        title = "Active Tag Scan - NoNumQR"
        id = "79c4305161124b5d87521adbdcb39683"
        deviceType = "MOBILE"
        width = 780
        height = 2582
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Y2OGM1MzhiODI2ODQyODlhODZiMzI3NmYxNGZhMjQzEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ui6ynIJ2tSuXYDXFtBa5Vpng7ZPdZpGVaQa4c7j29xw6VIAXW2YW1FlBkEjuUeSqnpg6kY-X7pAPxPwk5B862GFJ6uR6YrwvKPVfIAmCTiCTOajyK1SWFhkkKl9tPquJq_exHWYSnHkmWw6UzH-A57DbnfystyvcXBqc-U-3dCrX9MnJ61nmRdEXThLPiHBGMQ1mGt6G79Da3I9rdbST4V5devvyek7AIM4BRcIUPDFzOz9OBrhbVvNe9E"
    }
    @{
        index = 10
        title = "Private Call: Preparing - NoNumQR"
        id = "1e0d4256e66a48e39646307880c8d196"
        deviceType = "MOBILE"
        width = 780
        height = 1974
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAzMTVlMjg5NWIxMTRiYjY5ZDM3NzQzZWFjNzVhNjM1EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uj7fGMhynl3QDJwG25ap0kUmzOF4G4eftQ9GCJOh4Z7kJ_T0Bbck2WZApJ4atsvXxCo67SjNcQjV2Xl8lgu5Ji2PDSDyvNUlXFUGyChJRXAVIWMZKabNySoSytrrmZKm3dwfmsOQMwjID-iDrfiwtI5qXAtkCQR036lBiqPuauHgizqQlRNafCtRNvz1HS4FWXLetLapwNiyIjxIf_Xrd0914oB5v2i5s8boXj1k-CnUmaux-W-f90IE469"
    }
    @{
        index = 11
        title = "Active Tag Scan - NoNumQR"
        id = "5d6d39ad8bbb4bdf8eaaffe909e80ee5"
        deviceType = "MOBILE"
        width = 780
        height = 2582
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzA4NmQ1NjA1MTAwZDRjNmZhZGIyOWRkYzhkZDc2ODg2EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uiH4RtILYXF2Nig3c4iYVacUCKTeDnhER2UdEohUgWvjRZgRi0jh11NlP7wCQ_CkFzdkAyCL-C2xQuwC7RTbpNb_mJDxkALEJjgVrhSIft-z7Bnb8iLrQfkD-l2VhSBSrG4wvfOXpB0QVufvdMwNTEEQI9vGvEVI8-0qpZbyfLN-Yc9Vwza0o2EGV2H0ff-M0mA6t-Rst-LOPuAQ0mSQ5JFwKfasZeIOTkrhjlP6xK4KLmCNFRQnG9OIvs"
    }
    @{
        index = 12
        title = "Private Chat - NoNumQR"
        id = "050b34a661764a86ba37a5ab205a6a9c"
        deviceType = "MOBILE"
        width = 780
        height = 1768
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzZmMzQwYmZiZjdlOTQ4MmI5MGIxYzlhNmMyZWU5ZjE1EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uhG8kYCoFDNZOQCuYj8nHuekoU2lgPY-dYnz5FWgzF20NyIGUMq95AGkO-WC-N6RPCQLoca7CrmCZyyieEmOQBSLlHbf4LwoOwn2i9tpLrUdsqBhoVdAIzQNg8uOT9y_VEp6pxjADmQvKm65AgeGR9--xP630GX36-rMpRzOBdUghlbyAuHv6r05hgP71ITiUU8xdwlowDPBcWAQy3ZHUCilDiUiDKUSScHu77OTtiAQv9oVhBa-0KCViA"
    }
    @{
        index = 13
        title = "Track Order - NoNumQR"
        id = "b7cd9eca430c42dd93c202176c6b224a"
        deviceType = "DESKTOP"
        width = 2560
        height = 2956
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzBmODFhZTFiMjE2ZDQyYzFhOTZkOTU2NDZkMGZhODczEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ugJu5zOnSU9qYPmKXKxEGhU36MjfUAiYXG8QnSNLymPAxz-R4cEMcaxntLW0i7yFtrfw66pxrg5bHFrmvQH-KQQnIooOP1O0AQIUs2bIxX0WfmXN7t0eJ0ZjO0p08Ztb0FBcjnsGa_3gUgZbyDYAArKzNSAKq_9zRbGJKOwcy81IF_A_7qXvQRv2Fbxy2wdL7XGgU9UiB_EQHC4Kk0CCsfjAdIgChQMvMUTPv81RAJQ3K5aW1c1puIedUKU"
    }
    @{
        index = 14
        title = "Checkout - NoNumQR"
        id = "73d750c91ff049659a2b293b03a86c83"
        deviceType = "DESKTOP"
        width = 2560
        height = 2502
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzRjMDI4YzNmZGE4NjQyNTBhMmE2YjRhZjg2MzE2MDBiEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uipSYMy2g0q9acqM66lbtIBln8MighEo9fwCpQrw-oXXjfxwrlmYSJj_cI0y-mdq4V5Qd1zoQTgbIdVK-5deFYA9KRoEl0csXQUNmo5-f2asnCmWDM_qgrYHQPP-hivBfH8DEVqRlzjL5YVP_fgO_BD82Pcvr8EJdQ3mQ33ZbPUSVr5m7e5AYvPwtokypyevFIIkZnD16DgVLCxfXa9-hFj4AGjyo4ImxuZ0afQalW8OHhaBJKXpnbor2WX"
    }
    @{
        index = 15
        title = "Privacy - NoNumQR"
        id = "4f17c34e402a4ddbbb779ca4d1f1d87b"
        deviceType = "DESKTOP"
        width = 2560
        height = 2432
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzNmMTU2ZjNlZTIyNDQzZWQ5YjJlOWZkZmJmZmJlMWNhEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ujn9nD4FeEsp4MtAqPAI85sudJ-AprLSahn8wcTmVr1efLB6vYvzGydHjAtf_rGMz8dQaPdtKzsDr17D13Kfvx37fTFAcyJ2XDFhHHYMJcTXau_BcmosrPlT-eZ2fxMcGuBmKGAcdVZD3np1wwT0F_4ByYXbD3ShCYPP1V9aXvlibwMgbFAfbWoKAgMMJ-_yGhN3FQ8N2kWTGL-Jpyrh9RzLBA2J48yLUlGuhtitxkNX00HRd3y0nw5S44"
    }
    @{
        index = 16
        title = "NoNumQR Landing Page"
        id = "b69e2422f5654e629a8c4eb044a6555b"
        deviceType = "DESKTOP"
        width = 2560
        height = 2048
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzBmM2U0MTdhZTBlODRkNGM4OTgxNmZmMTNlMzEyMjM1EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ujpb67Gg_fo6SlB1RAE_EveViSz1P9brACf5aHK5uoMUwuahslbV7i81CjlZyY9JfszzghRRPesh7g-NnQKc1qoWOgTCkqW5lmWOYzga6xEhBFSH8w6ir-V_4cF2cg_s0DFD0pEK_I5NdBwhRnnJVita1FY8pJcIJf10WvowxCjJYdnYpHoQbfMboC4hcPYxlv35fXAzQB7-jrkTDLVcnn8zr9TAeVAr8LD1qFo_6O-B1nu3drBTGVnn70"
    }
    @{
        index = 17
        title = "Pricing - NoNumQR"
        id = "401df19bbbaa472487817aca105d7a57"
        deviceType = "DESKTOP"
        width = 3072
        height = 2342
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2VhZTkwY2FiODQ3ZDQxMmNhZDBmOTdmMDQwMjRjNzMxEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ujEbqEYB0c-PaZFqdDpz3978Zmbd0AFM0WaaHvaZM827dowolBNfpU2jhTXr-ooj0XlsSoM3OoivO2iJDvdDQBisNzkMPnj7MOQeM7bYnUK43ujmyzyQ4wYZoRCe7kS7X0eCI4uKiP5hM3rORIYzhVs6Z8jMr7N4CVWlLsFKNxPAlU5sT48g2g7X2So1o1quSTCAPOJFM4rum9by5HOv4MM5JGa8kHU-03KL4fTfETAQLTLZywsDhsT72E2"
    }
    @{
        index = 18
        title = "Shipping & Terms - NoNumQR"
        id = "3bbe61d80435456fb3a6bf03410620b0"
        deviceType = "DESKTOP"
        width = 2560
        height = 3274
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzRjYWRhZDZkNTAxYzRkZTBiZGFmYzIzNGE3MWFlNjg2EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uiqUdNU5qAOmNIhGFOMTuIbKz9o8kc-IwNB6Pp3JqvCfsDjhOVjZMuwAajaSGOcQDCGydlymvXOb--OYjo74esy6iEEhOsMA4NJZlEpKooHbHFxVs5hm2TWi5Wa7542kEf_8-HBFYptaQFWa07AFIMZeT0_uvVe60jzgOW6trtb3zhlzMMLZY9Db-xRYo5VRlFZku0KGndaB2GkkU5t-1vZhNzdjdVlJn1WBPivJZqUWEwqEay_Npgg1vUo"
    }
    @{
        index = 19
        title = "Admin Overview - NoNumQR"
        id = "3e45bf3d7020467a9294d3f9731852cb"
        deviceType = "DESKTOP"
        width = 2560
        height = 2096
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU2Y2U3OGIxNDFhYzQ4YjE5NGRhODlmZjkwMjJjMjE5EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ug1AX6wkaCBNXX9KEp2DBGEKxf0aie1nLqNQUSo4LPbGTGjpwQHHXeL_qjGCvFJFeVYyvtse_4Q4xoxsf6aiAwgpRvnp1VmtTNhvLQffXwREz-tuRuaul7z2MKT-I8MMJXqfJqFY9lbdHtwrA9j_SdnrQXm0Wt1c6JhSnqBxXt0-O_0aEMYnRs7UFx9AGAkBFdOjh33bHIFaxO6dbAN42yXlhdpfcJsRfaoWJtIpZaQj0LWcwBjiz0d4BQu"
    }
    @{
        index = 20
        title = "Chat Expired & Unavailable - NoNumQR"
        id = "eede5316265b4ee8ab20c49600bfc189"
        deviceType = "MOBILE"
        width = 780
        height = 1840
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwNDU2M2MwMTdhYjQyZmFiNzY5NzQwMGMxZmFjNmIwEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uiOKmFcN4daY_OaIeZVwOB-SZJX_qLK94CX4aJ5Wr68WZ2IYI_-WopIWwOnrRFAcMhYkjndX66Mt4J2xts7HMykm_QZTVo79mPjnMR2ARCJUbtoOldBdstfcjuxPyJKQo5-MWJpKf2wP0g6uVH4DeODof4hUqd6uudY0tWZ249dw2280axCriG4YpDWH-pXLDouEGqkS63Nei0T0bOvVO-0QMlI9nni2JTNjR9Eu0fsaK6YbxZAgAgsyB4"
    }
    @{
        index = 21
        title = "NoNumQR Product Catalog"
        id = "2f57d134557f4b2aa9d5abde13e453f3"
        deviceType = "DESKTOP"
        width = 2560
        height = 3324
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzY5ZWE1ZGQyZjlhMzQwMWQ5NmQyZWQ5ZjhiY2YzNGI4EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ui_Zvl8yJeUxT3TAcU_Vw-R41CSlCzGnnTrr85hIBsFFFNDjzEJtL8jbOj_XA3e57o3RzZO_5UKwGsfSGTt__K-Z1rHyJhkYXkPbS3zS_fybJQtwtQ_vej6X3IxJQb7P8wC9__FGnDcuL6i3spERSrblqk3B4gcLbAc1yuq83Lp9KQQ_mPhdkwwZK65ySybF3TYtBOxF77IIAjvo-PwCpUx0xycsHtaNg8ISZkT1re5K98UiOl-cBlYKSaG"
    }
    @{
        index = 22
        title = "Admin Login - NoNumQR"
        id = "e560969c5a484901bf7ab77f530fefed"
        deviceType = "DESKTOP"
        width = 2688
        height = 2252
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzA5OWZjMTUxMGU2MzRmYmNhM2Q1YTZkNDFkNGJmNzdmEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uhxt37dAkVlVdKzrKQX2nQYUAIka03cHLug1b1RyxS_ioG5O_vjSZu5LBnghUVmdhlO7ENO93hxwMDJeWW4anA44EcMHcW24dhLg8mn7ArrLEtVzW4hbySceRGutS0foRJSIX75UdOicdKX6bWeH7sv-2kWjkDyqUTAmGanITtTvvlDowNslxx9XOSF12NyNY2PogqA2etVTuNGIMDQqejCJCTjpjmUVGacfzoW8ClRC2d_lKFtuIaeX0F7"
    }
    @{
        index = 23
        title = "Private Chat - NoNumQR (Desktop)"
        id = "1d937ebc659d4c38bb661bf430cca89d"
        deviceType = "DESKTOP"
        width = 2560
        height = 2104
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQzZTcxOTA5YTAwMzRiOTZiNDA5NzNmYzMxMTA5NDI2EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uhyYHiYQMEbYwMGp2diwMuayo_vvrGhqcW6pUh22qaTP0W4Mc_9h5C6a4PdfrR-z_7bJfYwAghkKx6ohf94x2_2a5xWWwzsTtx1n_Siwgrael_bfvUSXDBBvCz9aiDIaSQD5XAJOECFWP_2vLaEZ6NZvhNqABT7kup8GlQa2D8N4R-UU2dthTbKSNNHYqWOVIyPZG0_yF0AM6Puc92_4VTZnsKEKvAfcGVdvJivI9ZzhZeA0b7cUmtui28"
    }
    @{
        index = 24
        title = "Owners List - Admin Console"
        id = "8b21502efd0b4ffc9aa6a52c70598ebc"
        deviceType = "DESKTOP"
        width = 2560
        height = 2048
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQ3MWUwOTQyNDU2ODRiZWU5NGM5NDAyNTExYWUyMTE1EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uj_lQ5AY2CrWm15eBG3LZUcP-WKhyxYDkpyQLSrBz-zM9bmqxR26KUlJye6AgnDE0OXdAAc6yIgcCOKIYxYYvk0yPAnu-mjT18HB-qje42WllBece5Hm3np9fl9GG9IteR1y2ZVOJI9y84PGSdCIlNFDaldizvkuc7c5wJp7R-mewXbHpLb5wfrifK1yx_cgPqT1eBGBbX2kqOy5UzmQdEK7t2OJoiLXKNM1nIw59BsKt5f4FUhGWgAfEFC"
    }
    @{
        index = 25
        title = "Contact Us - NoNumQR"
        id = "2ac74180ee41471a9d839058abd4459d"
        deviceType = "DESKTOP"
        width = 2560
        height = 2084
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2U3OTJjMzQ1Y2RkYzQyYmJiZmVjYjBhN2NlMzI2OTA0EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ug2Xv3Z1KIk7xT-F0A8B33I-t1J-BvSlitaExPGSGEH47xQLRKfcgkCHjKCVF_F9hzlokVqIgNVTAHn0KvhGy9QZD8SqFDgU8X2Corba4hbEOYijJnrkAkDUduGwR7RZScCKksjW-LQU3MoIQbWdSgEjiAxKGc-tg57fiSO1AexY12NuC_TP9Bdf3qz3-aKrH6Xvo3W-4N76rrhOi5HSVwO08xoYp3zvyoHI50w9d86XJttUS74HC92cDA3"
    }
    @{
        index = 26
        title = "Orders - Admin Console"
        id = "3609e67ba8f1434290f6eefcc2af7415"
        deviceType = "DESKTOP"
        width = 2560
        height = 2048
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2ZlMDg2MjVhYzcwMjQ5MTQ4MWE4Y2YxYWZkYTcwYzkxEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uiUpDTHFSEtFHbpTBDUNV4Zm88YdLD810zxuZz3GaMhrBqsRwZT1TTOInt1g-V7DGfWQjP42ZkyUnCCaS-rZkxJTIEc5LCvCtPSDQMDP5NiSy5fZyZhmwQmO0-eQ8OgPrIvKKfLCT8ZD4h9EIsdBFOQDc4Ks1Fy0UFzW5CvbXq5iOSC_zN0Ru21JMdwY8dZ1EM4-Joy0CrUJRKkgkPMo1Y8z8ab2dkFXRdDn4hCDDVIvkMaxPdhFRt_Orc"
    }
    @{
        index = 27
        title = "FAQ - NoNumQR"
        id = "fb4bc511a801464b949547fdeb8a4d86"
        deviceType = "DESKTOP"
        width = 2560
        height = 2458
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2VlNTBjNWUwZGZkZjRhODg5MjExYTRjNGI3NjkyMGQ3EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ujx8mNz2wMCGYJt5F5qrLSxwMEgQt8ef0Wzn5zfqSQ6yXXxyifZ2dyBIy6cmrbt5rrkNsdaDTKg_T3rbxq5Xz_IjAtvNrRNXZfbhUA3Hc_ct2x63sHwahAtqqAtQ37M_Nx5EqM5sw-20SjeWjDRlfeMAjhxsLgwYHVknDkPc3LvAX5S__Ro0yHUOv5zDRH7WMuXfpjx58IwJTuJV2jFFEkBZCS4QiMoaulEtg8qVyLKx0sJ6cCy__8K_fU"
    }
    @{
        index = 28
        title = "Private Call: Connected - NoNumQR"
        id = "eb64cbb76f474ceea4f69a6a808f6868"
        deviceType = "MOBILE"
        width = 780
        height = 1768
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQ3MzNiZWExZTI1ODQzYTc4YTY3NjU5OTk4NGM3Y2I4EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uiUpyimN9vFeu3d0T-ykkDEhrWOudqbmXdBSEwpbOIuBPcZ0gCBhJOQHOs_wAlPElPzWwJqVQQ24Y8BEHT79dycoA69nCLEiy49Qm8LW6LqKBX08jbbfswmaxWL-5eUkjDtrMHcSz95xHtMZResy4pTO5THMCvwiUdIBnvOj23UXeNWlVoC1v1HcPkmSQOvYkaCVG-UZkmKh_KudiK8ENCskMYBWp-RN5F0LjP9R2-uA2J_jQYTTRMANWD4"
    }
    @{
        index = 29
        title = "Download App - NoNumQR"
        id = "ea57736d33d74d46bac9ca30267a8cac"
        deviceType = "DESKTOP"
        width = 2560
        height = 3122
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzI0NjUyZjMyMzU5MjQ2Njk5OGQ2MjZmMDk0MDFmN2RmEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ugf8SM-ThxhaoTeNXMSPVhNdeMajWgBNrZn7Ui3FYDIXXg790GRZqZnxNSSJyQllsTeTFg9z1r86PbV32QoO9BtljSsBq3Qg8PPCJ4GE3bQmfboH3PLqMOeqlsoKiEVb20W2PXfCNnmijmUdb38tp9CYe2HCRH4xjBO3kuS_JDK6C8Mqj8xUJm-Y8zZaNdNEYvYe7Ui9dTg_5aHq1ixO_k_uzC2j4E4IxfPZ7pUSvBfZmlH10d1w50M5Dc"
    }
    @{
        index = 30
        title = "Owner Detail - Admin Console"
        id = "bb32366904bb4406b846d980bd878a30"
        deviceType = "DESKTOP"
        width = 2560
        height = 2714
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzEyYjdmODAzZDdmZTQ5MDVhMzI1OWJhMmEwZDZlM2IxEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ujNkIzZupFLT47KnahTstPzpmZ5Cu7p4JZ6Kkm_2ecB5pJ55JFlpGFYbBZv7aO6YSK-Z1y8zZRYg-DwrRLJ02y9HFs5yBoxgjDGwTyUvwswafq7U9nbaru9cujc6FaQyKbhajW0wu1V2kF5oenaCB0B4YCOqLw5vfvoOv0d-OvVA_IZeramxUREVp3Bvd6i4mBsQ4adLJgkSxNCRXyYqbrakZze8pf3qGkx1xL7-tMiqjviZTQwSePpB3g"
    }
    @{
        index = 31
        title = "Audit Logs - Admin Console"
        id = "d2c0df4e719f434c96bc2b46b30c4017"
        deviceType = "DESKTOP"
        width = 2560
        height = 2048
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzE1MTRlMzY5ODIxZjQyNzM4ZTkyMjg3MWU3MThhZTU1EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uhEiTmxE2PpEqTa_s_FX_Jr4Ilnzl1gRGpoZKL3nBrazjdXYpcF7MG0VLNKM3tVMxIiG3s7_COJJAtBeBvZYj2MzglUwTeTaiqECygkA94mHcye2e0adewoJQVE786Uka-rd12jwERIspye8cfSNrsbcYS7GzsRhrIiTHh7pd3VX0m1yrp0MXsOJ2o6_DdcvHcTo_qJ45nTCJNFKkaRMnTj3l_HhlHbR-0bC3hZyJgd-yN-LaAcUXHyFLao"
    }
    @{
        index = 32
        title = "Tag Details - Admin Console"
        id = "2b7b059e7f55438c93741c94699c7d71"
        deviceType = "DESKTOP"
        width = 2560
        height = 2184
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzZmNzg5ZmI2NWJiNTQyZTFiZmRhNjE5YTkzY2FlZTA4EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uhro0-S3RWCC9o3JMkb6IzKrqnbG5IK6DkHCYVBs68RYcPbANX6nxKo51IWNM6ik5ASWcU8QMDxtA8NSPgCspm4m-TFfO6HNwLwzs67-jaclDRF191YnGzkkdLJbD9P8yOmP-GpgeJ5ajF3KRHMP6OCcQt9Rj70II-neldNVkkX5KVryNKmhjnRyWPLvW2jl9sSW_4LjS1SSx1Fbos9PgV1QKaERNDV3F4FqOytb-LIPa2Jvf7nUd_GXcFW"
    }
    @{
        index = 33
        title = "How it Works - NoNumQR"
        id = "c888ec1b3c6c4ec7b1a0f54234956899"
        deviceType = "DESKTOP"
        width = 2560
        height = 4308
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzA3ODkzZGUyYTg2NzRkOGE5ZDQ3M2NiOWVmMTczNmZjEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ujgvng7dQ6p9I3VQBHNHzy3twNUWhGonBqQAT0SJ1VfMEuuWa4rvT_8A-u72uB9WGhinD7C-FgttXfC6H1C5TmwMldDjmkydRXpu_PnpCCI6D9_lvFnFo7NbjtuGRifIueAV-5uTNAhE-i678BUwbGn6RAGKgXRQkQBcDezi1G6wFccCJRnrFCQQHRmHOHSvoplWl0IjiO5wgOKXausDF4xQmpY76n5JoKSYKWVnxX5gec2b2UxOtEMWFDo"
    }
    @{
        index = 34
        title = "Message Sent - NoNumQR"
        id = "db095e04ce0f4c768b4a623ac33c637a"
        deviceType = "MOBILE"
        width = 780
        height = 1768
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2VlYjY1NjM5ZTM4NDQzNWFiMjhmMDc2ZDM1NDI0Y2M2EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ugBca17LVWPoSY1Z-VrNJQ9V99cwriR0tWn6IIa-f7RJJSkdC7ofn0AkTKHYudVcdec9-ztUCrtE_WauiHNSqUGplixyyZm-_6P1tLQ6uELb5cg2L8WWqob4-5kSGobuzvI8HVuH-jjG4mvCU_T-q0tIfBIsMVUxXhr1CbayrO4VIG6r_rMjMIHlDPEtGI5VWVgWhXLq21-m35YFevJuP0tVipASCduegwX6H98-lARy35XZ9eCVgmOdcY"
    }
    @{
        index = 35
        title = "Premium hero image for NoNumQR"
        id = "a5717aacd23540bebc5e2e5f3f9ad259"
        deviceType = "IMAGE"
        width = 1376
        height = 768
        htmlMime = ""
        htmlUrl = ""
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ugPqkWsUd8OVJ1WrQiat9G1hTL4r_Bbf6YgZxjjoUYl6QznEzrWjN4DO7Yy21035MbkxT4FWGnXFqCBUvYstm-URRUQX4t1N9OOK0j_lmGXF7NlocmgTQcQ-L6KdcDhquiF22L8p3a4JVGatvLj-3AxGeebT9Z-yRRqD0ae1ThctGMfcSN_n8bAGWbIBNdBG4r-fxTPChep6_YEJ85hfm9mjtTfedsdHnVaYZWgnByt-JRzrpMB0tdJrZqV"
    }
    @{
        index = 36
        title = "Chat States (Loading & Expired) - NoNumQR (Desktop)"
        id = "e87781a157124f83b35407b5c1d4a1e6"
        deviceType = "DESKTOP"
        width = 2560
        height = 2226
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2M5YjQ2ZTZmMDhiYjQwMGNhZjZmNGI4YzEzYmFiZWVkEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uiBDuwaBshQdz8eYdYReFv1mgqkQPeyE3I1ZwX-fzKaQrDGS-ypbXVC5S0lYIwuxn8kQieUrGuJTiDHwuMhQfIK2bukspOJ93y4f-tJaQ_yEa971eJk0Yxng6TSY1dWLv48YnLC7kmj1lzw3CP51O1ftxv6JsuFwXE9tojG4TyHoQPR5vuSD_H-v_-V5FlqWl5I0PuYLJFKS-LhBAQFbWopcAV5qDOZB6YwNSyIqPLN4S_uo5_rdTFipkun"
    }
    @{
        index = 37
        title = "Connecting... - NoNumQR"
        id = "f03b1906ee52491da0e0fcb8d0e04091"
        deviceType = "MOBILE"
        width = 780
        height = 1768
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQyNDZiM2FmMjk5ZDRiZjdhNjgyMzc0Y2EwZWEyNjkzEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uhe-JV7Eb38cw-dR5t_JQP5s3gt4lf8Rot9_0W2DhFV_GPEpFrx7YIKkjvxjWmL5R41YIZi3v9Ggn8EbbOhHVbfdhMqey3DjtLwAy1b9osy3hg1SxDpTPQmfSJSiiXFQGkncKZbY2hFwgHSR24TrOyFRRl46vw_miOufup-AyZQDxbV33JVHQd8e-BCPVzqr92U5QDxySybfT9W75s_0LLy0DBU4sqe3QabttZyc4teZJe6E349Ylk9Ndt0"
    }
    @{
        index = 38
        title = "Settings & Health - Admin Console"
        id = "d445596902d6446da38289b113ab4a75"
        deviceType = "DESKTOP"
        width = 2560
        height = 2772
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2I3YWNlODE2OGI5MDRmOWQ5ODY5ODhlNDhhYjQwYWFmEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ug1KugNfTqVnpsZTACkcYGB034JHuVdZn-G_HTxNx4vgWrO4hEa50gnWXUV9Rsqq6FPKw5B7yKGuY9DHTb8FeLQB94O-t5VTMLwJ97EtQu7kGGkq_RFo-eubpb7PRYiekW5lt8kwmKyIBgXw6YD7Ode2-jo-YHobenBd4hM9ToOUc_H4YFV61gc4gHBSHw0OM-4KffT0df_K6WJkYk27YXkDFEqjZv-axlwgx4JFyf87xdt9pbGLjoMIypE"
    }
    @{
        index = 39
        title = "Tag Inactive - NoNumQR"
        id = "343d2077d0aa4608b68f4d9136610ca6"
        deviceType = "MOBILE"
        width = 780
        height = 1952
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzRkMTRmMTMxNmNhMTQ5NDlhOWYxY2NlY2NiNGQ0MTdlEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ugA_VclD7i_6bXegBYomhclMzGzS7xC5t8PTexa0A6jcr95cqqShEWclN8mrql9qCJrXcqHUbdJ9x5-qFhTy4-xUv1Z3CE6JwM4ZqW7gZe0C5uTqqRt6E-Fx1JQJ6j33b2YL2P28LWfpBwqmwbBgtXQPTAZcLFs-bkxXm4H0m8YqYCud2f2H6JaSYn_ErnFB0kLq7PZXZGgX6Tf5Vl6DaRo2CP6oXY4EEpFTOBXOlJmbA3suc95Ssv5ynZT"
    }
    @{
        index = 40
        title = "Admin Dashboard Shell - NoNumQR"
        id = "8e33006333934255954aa487ccd4401c"
        deviceType = "DESKTOP"
        width = 2560
        height = 2048
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzc0NTIxYTNiN2Q4ZjRlZGFhZDNmMTg4NGJjYzg4NGQxEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ugyv18cRWF2gyTgPDhfa9zOvfAfrU15T1PaS-5hDZE59Fs8V46TAi-XyEQEAkPMXE_9DaiziiHN0uNRSK5-vjfsJxFAZMigfY1Hyz_Sn4ubhlhOZ__WFXo_RDIMzaYG4cCHM_UECnFms02EpSDuarGfl0e74E2hGmO1fJZO-hhv2sSp-JQ5XEsxNdgZG838GGbL-1yJZofhwkqZxnQWzsmk4-Qvx4Pkl9h3HyVoQVuoVyMLerIpVpnNFdue"
    }
    @{
        index = 41
        title = "Admin Overview (Loading) - NoNumQR"
        id = "7ad055a19ef04cd686e42c7b5d85b65f"
        deviceType = "DESKTOP"
        width = 2560
        height = 2456
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzljNzhjOTg3NmQwZjRiNzY4MmEwNzI3MWJhMDcwOGY4EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uiKAJyFkdD8PyTyhpAYNSaNuNnr_XZuP-JDS3NNVT-wreHn_1eYmQ8IAltdB9D2PMfQFfRUwLNlOmbuncu6bly91vK0cSivH8Uamkk7iKcYbRM5YhxHR32d_A9sFR2_OknySV5vhEyinj7hLfhuvCLKubOtho0fFlMIZMviTv9-oJOsd8-U7t-or95wJ8nNNJHThFkvdk7vVz2t2ltYT_B199whzAQpnkjuNa7Vnuemw8_un-MoSp54P4c"
    }
    @{
        index = 42
        title = "NoNumQR Web UI Kit"
        id = "aa50e1f2f70c4e8aa03e3b41f14f790b"
        deviceType = "DESKTOP"
        width = 2560
        height = 2048
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2FkMTYyZTg4OWMxOTQ1YTM4ODA5M2M1ZTM2NzcyZWJhEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uhBILzkvDlPyXGIvksmKhgunxyT0w85HksfZOsf8KhOhc-u8qsyeBAJLiKOGOXWSYREcWibGcejsGwOMwMfUcezI_9WcmbGzvvd-1Szc-m9SOhC6ffMzqik72nhhXQvA_4LLplRakZxYebjK_noT1rH4IRYN0QAQzuX4lh1XckZpC5uR07hvWgk55R-Xg-jY5gCY6bD_Bw_RUiYdfv8Uy-dYIA-s9MIKTdKpCd4vFnqxGsJ649YjfwyOVzp"
    }
    @{
        index = 43
        title = "Users - Admin Console"
        id = "f95b9e6d53c04228ba0985782f3423fe"
        deviceType = "DESKTOP"
        width = 2560
        height = 2048
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzExOTg2YTE2NGUzNzQ4MGY4ZDZhMmFiZGMwMTdiZDZkEgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uhgcRZJVbs2fkn6kkdumwYcWk4E9SKVeWpv20vRrJNQePrFVfoCh_fNMa9V-5V98MRv-EbBKV_Ty1GzvTXFQ1c9j66QfQvsCU8o1kEhT3UYe_2Y7j07gFxo1VpPtI0v8M7X6RlQgSTv-1NLCKrq7Q7NVYfayo8f3vRh88Dks0DbQW6p7Fn-6Q70wUMC1pkpqczqARkVBu_cJ4XVKwq0lg5Utl485XoeCk2VDWqUOOiueJCpJU0ATVzG5-_r"
    }
    @{
        index = 44
        title = "Reports - Admin Console"
        id = "4033e9f0359b49688dfa5886cbbf6ad1"
        deviceType = "DESKTOP"
        width = 3520
        height = 2048
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU0NGMyZGIxYWNkMTRjOWY5NGI3OTY1Mjg0YzE0NWU5EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0ujO0wvr3BtHXkz4kOhRAbSWzbFNkQ3XbgdCq20ByaWt6oB4wWWmiNOCx066mxSw1Ovm63ImQVMxAGWo4opFrLbdwsDZSslVn0Ru_VDcoFQdSHsv3CdO-K6Z-kV3lK9RE5Me41eipezGTSLUDpeGqM0lzI5P3ftyGB7Y1gY2kA2deCuX-7KTf-UJKO_UXKKcWkmAKjEviaCbUGfACawwVASJXPs0euBMTJSjk8d_WGCoRPWKnccgzlGJWq_t"
    }
    @{
        index = 45
        title = "Create New QR Tag - Admin Console"
        id = "c4ed35f9d1da4ed7b337d5bd9171f179"
        deviceType = "DESKTOP"
        width = 2560
        height = 2048
        htmlMime = "text/html"
        htmlUrl = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzI0Y2I5YzMyZjU2ZTRiYzdiOWY5MDViMGJhYTRjYjI2EgsSBxD-9O_ImQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxODAxNTQ2OTQ4NTAyMDQ4NjY4OQ&filename=&opi=89354086"
        screenshotUrl = "https://lh3.googleusercontent.com/aida/ADBb0uhObN6EGUDYkE8Us-Oou8l_hpgxelh7vKF9YMsqcwvRQ5ezrZs24u3pP7O9jB-KRdKDgsxMuQj5a3NzjXt-C-HT0ul7JZPX_QxnVrQdC4YJL48ONvKSHxG2dd_OzN_01GtVYkBrOVBHRUu-BKAgnl1gQcZgfGVoSky8FQOHc1EHvUEJ8VSru7tqh0fZSrknnS64aX2dP7A3SQOg-0K27h53PbjZWg4HyW6ikQ-I-yXqMhwgEGGz_mqnv7R9"
    }
)

$sourceManifest = $screens | ForEach-Object {
    [pscustomobject]@{
        index = $_.index
        title = $_.title
        id = $_.id
        deviceType = $_.deviceType
        width = $_.width
        height = $_.height
        htmlMime = $_.htmlMime
        htmlUrl = $_.htmlUrl
        screenshotUrl = $_.screenshotUrl
    }
}
$sourceManifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $sourceManifestPath -Encoding UTF8

$results = @()
foreach ($screen in $screens) {
    $slug = Get-Slug $screen.title
    $prefix = "{0:D2}_{1}_{2}" -f [int]$screen.index, $slug, $screen.id.Substring(0, 8)
    $sourcePath = $null

    if (-not [string]::IsNullOrWhiteSpace($screen.htmlUrl)) {
        $sourceExt = if ($screen.htmlMime -eq "image/svg+xml") { "svg" } else { "html" }
        $sourcePath = Join-Path $sourceDir "$prefix.$sourceExt"
        if (-not (Test-Path -LiteralPath $sourcePath)) {
            Invoke-WebRequest -Uri $screen.htmlUrl -OutFile $sourcePath
        }
    }

    $screenshotPath = Join-Path $screenshotDir "$prefix.png"
    if (-not (Test-Path -LiteralPath $screenshotPath)) {
        Invoke-WebRequest -Uri $screen.screenshotUrl -OutFile $screenshotPath
    }

    $results += [pscustomobject]@{
        index = [int]$screen.index
        title = $screen.title
        id = $screen.id
        deviceType = $screen.deviceType
        width = [int]$screen.width
        height = [int]$screen.height
        htmlMime = $screen.htmlMime
        sourceFile = if ($sourcePath) { (Resolve-Path -LiteralPath $sourcePath | Select-Object -ExpandProperty Path) } else { $null }
        screenshotFile = Resolve-Path -LiteralPath $screenshotPath | Select-Object -ExpandProperty Path
        sourceHtmlUrl = $screen.htmlUrl
        sourceScreenshotUrl = $screen.screenshotUrl
    }
}

$results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $localManifestPath -Encoding UTF8

[pscustomobject]@{
    screenCount = $results.Count
    sourceFiles = (Get-ChildItem -LiteralPath $sourceDir -File | Measure-Object).Count
    screenshotFiles = (Get-ChildItem -LiteralPath $screenshotDir -File | Measure-Object).Count
    output = $base
    sourceManifest = $sourceManifestPath
    localManifest = $localManifestPath
} | Format-List
