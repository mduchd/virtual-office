<p align="center">
  <img src="client/public/assets/brand/logo-mark@4x.png" width="96" alt="Habblaud logo: tòa nhà pixel-art nhỏ" />
</p>

<h1 align="center">Habblaud</h1>

<p align="center">
  <b>Văn phòng ảo trực quan dành cho các trợ lý Claude Code, Codex và Google Antigravity.</b><br />
  Mỗi dự án trở thành một căn phòng, và mỗi agent hóa thân thành một nhân vật pixel-art sinh động thể hiện mọi hoạt động theo thời gian thực.
</p>

<p align="center"><a href="README.md">English</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <b>Tiếng Việt</b></p>

<p align="center">
  <img alt="Node.js 22.12+" src="https://img.shields.io/badge/node-%E2%89%A522.12-5fa04e?logo=node.js&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white" />
  <img alt="Zero runtime dependencies" src="https://img.shields.io/badge/runtime%20dependencies-0-f08a3c" />
  <img alt="Giao diện tiếng Bồ Đào Nha, Anh, Tây Ban Nha, Pháp và Tiếng Việt" src="https://img.shields.io/badge/giao%20di%E1%BB%87n-PT%20%C2%B7%20EN%20%C2%B7%20ES%20%C2%B7%20FR%20%C2%B7%20VI-4aa8e8" />
</p>

<p align="center">
  <img src="docs/screenshots/office.gif" width="820" alt="Hoạt cảnh văn phòng Habblaud: các nhân vật gõ máy tính tại bàn, subagent đeo huy hiệu và bóng hội thoại hoạt động" />
</p>

> [!NOTE]
> **Tôn trọng bản quyền & Ghi nhận tác giả gốc (Credits & Upstream):**
> Dự án này là bản fork / tùy biến từ dự án gốc **Habblaud** xuất sắc của tác giả **[Márcio Junior (@marmottajr)](https://github.com/marmottajr)**.
> - **Repository gốc của tác giả:** [https://github.com/marmottajr/habblaud](https://github.com/marmottajr/habblaud)
> - **Giấy phép bản quyền:** [MIT License](LICENSE) © 2026 Márcio Junior.
> Toàn bộ ý tưởng cốt lõi về văn phòng ảo, bộ dựng đồ họa pixel-art và kiến trúc ban đầu đều thuộc về tác giả gốc. Bản fork này chỉ clone về và phát triển bổ sung thêm các tính năng (tích hợp Google Antigravity, bản dịch Tiếng Việt, Cloudflare Tunnel QR code và các script Windows).

---

Khi bạn mở nhiều phiên Claude Code, OpenAI Codex hoặc Google Antigravity trên nhiều dự án, kích hoạt các subagent, chạy các tiến trình dài... bạn rất dễ mất dấu ai đang làm việc gì. **Habblaud** quy tụ tất cả vào một văn phòng ảo trực quan: bạn có thể nhìn thấy ngay ai đang gõ bàn phím, ai đang giơ tay vì **cần bạn hỗ trợ**, ai đã hoàn thành nhiệm vụ và rời đi, ai đang đi pha cà phê trong lúc đợi câu lệnh tiếp theo — và lượng quota đã dùng trong phiên 5 giờ cũng như trong tuần của từng tài khoản.

Đặc biệt, khi hai hoặc nhiều agent rảnh rỗi, văn phòng sẽ có **đời sống xã hội**: mỗi nhân vật có một tính cách riêng, họ rủ nhau ra phòng chờ xem bóng đá trên TV, chơi game đối kháng, đánh bóng bàn, buôn chuyện trong bếp, soi gương chải chuốt hoặc cá cược xu qua trò oẳn tù tì. Xem thêm tại [Đời sống xã hội](#đời-sống-xã-hội).

Mọi thứ vận hành hoàn toàn trên máy cục bộ của bạn, chỉ đọc các file mà các agent tự ghi ra (kèm theo dòng `alias` trong shell để đặt ký tự nhận diện cho từng tài khoản). Không có dữ liệu hay thông tin đăng nhập nào bị gửi ra ngoài internet.

## Mục lục

- [Hình ảnh tổng quan](#hình-ảnh-tổng-quan)
- [Cài đặt](#cài-đặt)
  - [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
  - [1. Tải dự án](#1-tải-dự-án)
  - [2. Khởi chạy Habblaud](#2-khởi-chạy-habblaud)
  - [3. Cài đặt Habblaud mod cho Claude Code (khuyến nghị)](#3-cài-đặt-habblaud-mod-cho-claude-code-khuyến-nghị)
  - [4. Tích hợp Codex (tùy chọn)](#4-tích-hợp-codex-tùy-chọn)
  - [5. Tích hợp Google Antigravity (tùy chọn)](#5-tích-hợp-google-antigravity-tùy-chọn)
  - [Truy cập từ xa & Điều khiển bằng điện thoại](#truy-cập-từ-xa--điều-khiển-bằng-điện-thoại)
  - [Cập nhật phiên bản](#cập-nhật-phiên-bản)
  - [Gỡ cài đặt](#gỡ-cài-đặt)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
  - [Ý nghĩa hành động của từng nhân vật](#ý-nghĩa-hành-động-của-từng-nhân-vật)
  - [Giao diện điều khiển](#giao-diện-điều-khiển)
  - [Chủ đề văn phòng](#chủ-đề-văn-phòng)
  - [Ngôn ngữ](#ngôn-ngữ)
  - [Chu kỳ ngày/đêm & Âm thanh mô phỏng](#chu-kỳ-ngàyđêm--âm-thanh-mô-phỏng)
  - [Cửa sổ Terminal](#cửa-sổ-terminal)
  - [Terminal tương tác (tiếp quản, tạo phiên mới và dừng)](#terminal-tương-tác-tiếp-quản-tạo-phiên-mới-và-dừng)
  - [Timelapse tua lại ngày làm việc](#timelapse-tua-lại-ngày-làm-việc)
  - [Phê duyệt yêu cầu ngay từ văn phòng](#phê-duyệt-yêu-cầu-ngay-từ-văn-phòng)
  - [Gửi tin nhắn trực tiếp](#gửi-tin-nhắn-trực-tiếp)
  - [Chỉnh sửa diện mạo nhân vật](#chỉnh-sửa-diện-mạo-nhân-vật)
  - [OpenAI Codex](#openai-codex)
  - [Google Antigravity](#google-antigravity)
  - [Hoạt động GitHub trong văn phòng](#hoạt-động-github-trong-văn-phòng)
  - [Thống kê "Ngày của tôi"](#thống-kê-ngày-của-tôi)
  - [Chế độ Demo](#chế-độ-demo)
- [Quản lý tài khoản & Quota sử dụng](#quản-lý-tài-khoản--quota-sử-dụng)
- [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
- [Cơ chế hoạt động](#cơ-chế-hoạt-động)
- [Bảo mật & Quyền riêng tư](#bảo-mật--quyền-riêng-tư)
- [Phát triển dự án](#phát-triển-dự-án)
- [Xử lý sự cố (Troubleshooting)](#xử-lý-sự-cố-troubleshooting)
- [Tuyên bố từ chối trách nhiệm](#tuyên-bố-từ-chối-trách-nhiệm)
- [Giấy phép](#giấy-phép)
- [Đời sống xã hội](#đời-sống-xã-hội)

## Hình ảnh tổng quan

**Toàn cảnh tòa nhà:** Tòa nhà văn phòng có sảnh đón với thang máy, phòng bếp, nhà vệ sinh và phòng chờ giải trí; mỗi thư mục dự án đang có phiên làm việc mở sẽ sở hữu một căn phòng riêng dọc hành lang. Phía trên cùng là thanh trạng thái và hạn mức sử dụng của từng tài khoản; thanh bên trái hiển thị danh sách phòng và agent; phía dưới là dòng sự kiện hoạt động (activity feed).

![Toàn cảnh Habblaud: tòa nhà với sảnh, bếp, WC, phòng chờ và các phòng dự án](docs/screenshots/overview.png)

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/agent-details.png" alt="Bảng chi tiết agent với danh sách tác vụ, subagents, dòng thời gian và thống kê" /></td>
    <td width="50%"><img src="docs/screenshots/night.png" alt="Văn phòng vào ban đêm, đèn đường và ánh đèn phòng bật sáng" /></td>
  </tr>
  <tr>
    <td><b>Chi tiết agent:</b> hoạt động hiện tại, tiến độ tác vụ, danh sách subagents, dòng thời gian và tài nguyên sử dụng.</td>
    <td><b>Chu kỳ ngày & đêm:</b> bầu trời ngoài cửa sổ và hiệu ứng ánh sáng thay đổi theo thời gian thực tại địa phương.</td>
  </tr>
</table>

<table>
  <tr>
    <td width="42%"><img src="docs/screenshots/collab.png" alt="Subagent bàn giao kết quả cho agent chính trong khi một đồng nghiệp khác xin phép cấp quyền" /></td>
    <td width="58%">
      <b>Cộng tác trực quan:</b> Các subagent là những đồng nghiệp có tên và huy hiệu riêng: bước ra từ thang máy, làm việc tại phòng dự án và khi xong sẽ đi đến chỗ agent chính đã gọi mình để bàn giao kết quả (📦) trước khi rời đi.<br /><br />
      <b>Cần bạn hỗ trợ:</b> Khi một agent đang chờ phê duyệt lệnh hoặc câu trả lời trong terminal, nhân vật sẽ chạy về bàn và giơ tay nhấp nháy báo động — đồng thời thông báo nổi lên màn hình (kèm chuông nhắc và notification trình duyệt). Bạn có thể duyệt lệnh hoặc trả lời câu hỏi trực tiếp ngay tại đây.
    </td>
  </tr>
</table>

## Cài đặt

### Yêu cầu hệ thống

- **Windows** (đã kiểm thử hoạt động mượt mà với `start.bat` / PowerShell), **macOS**, hoặc **Linux**.
- Đã cài đặt **[Claude Code](https://code.claude.com)** (khuyến nghị phiên bản 2.1.287+ để dùng mod), OpenAI **Codex**, hoặc **[Google Antigravity](https://github.com/google-deepmind/antigravity)**.
- **Node.js 22.12+** và **npm** (được phát triển với Node 24; Docker tích hợp sẵn Node 24).
- **Docker Desktop** (hoặc Docker Compose v2) nếu bạn muốn chạy bằng container.

### 1. Tải dự án

```bash
git clone https://github.com/marmottajr/habblaud.git
cd habblaud
npm install
```

> `npm install` chỉ tải các công cụ biên dịch (Vite, TypeScript, tsx...). Máy chủ Habblaud có **0 dependency khi chạy runtime**: chỉ sử dụng các module tích hợp sẵn của Node.js.

### 2. Khởi chạy Habblaud

**Cách A — Sử dụng Docker (Khuyến nghị để chạy nền liên tục)**

```bash
npm run docker:up
```

Script sẽ tự động phát hiện các tài khoản Claude Code, mount các thư mục cần thiết (ở chế độ chỉ đọc read-only), build image và khởi động container. Sau đó mở **http://localhost:4747**.

**Cách B — Chạy bằng Node.js trực tiếp**

```bash
npm run build
npm start
```

Mở trình duyệt tại **http://localhost:4747**. Nếu bạn muốn phát triển code, hãy dùng lệnh `npm run dev` (kèm Vite Hot Reload).

**Cách C — Khởi động nhanh 1-Click trên Windows**

- Nhấp đúp vào **`start.bat`**: Tự động đặt ngôn ngữ Tiếng Việt, mở sẵn trình duyệt tại `http://localhost:4747` và khởi chạy server.
- Nhấp đúp vào **`run-silent.vbs`**: Chạy Habblaud ngầm hoàn toàn trong nền mà không hiện cửa sổ dòng lệnh đen.

Giờ hãy mở Claude Code, Codex hoặc Antigravity trong bất kỳ dự án nào và chứng kiến nhân vật của bạn bước ra từ thang máy! 🎉

### 3. Cài đặt Habblaud mod cho Claude Code (khuyến nghị)

```bash
npm run mod:install                        # cài mod và các plugin phê duyệt, tin nhắn cho từng tài khoản
npm run mod:install -- --sem-permissoes    # không bật tính năng duyệt quyền từ văn phòng
npm run mod:install -- --sem-mensagens     # không bật tính năng gửi tin nhắn từ văn phòng
```

Habblaud cung cấp một [mod](https://code.claude.com/docs/en/plugins/mods/overview) chạy trực tiếp bên trong Claude Code và cài đặt vào từng tài khoản thông qua lệnh `claude plugin`. Khi cài đặt:
- Thống kê **hạn mức 5 giờ và tuần** hiển thị trực tiếp theo thời gian thực.
- Xuất hiện câu lệnh **`/habblaud`** trong Claude Code.
- Cho phép **duyệt hoặc từ chối các yêu cầu quyền** và **trả lời câu hỏi của agent** từ văn phòng qua plugin `habblaud-permissoes`.
- Cho phép **gửi tin nhắn chỉ đạo** đến agent từ giao diện văn phòng qua plugin `habblaud-mensagens`.

Kiểm tra trạng thái bằng `npm run mod:status`; để gỡ bỏ: `npm run mod:uninstall`.

### 4. Tích hợp Codex (tùy chọn)

Nếu bạn sử dụng OpenAI **Codex**, các phiên của Codex sẽ tự động tham gia cùng văn phòng với huy hiệu **CODEX**. Habblaud tự động tìm kiếm thư mục Codex (`~/.codex`). Để nhận thông báo trực tiếp khi Codex cần bạn duyệt lệnh:

```bash
npm run codex:install      # thêm hook Habblaud vào ~/.codex/hooks.json
npm run codex:status       # kiểm tra trạng thái
```

Sau đó mở Codex và duyệt hook trong mục `/hooks`.

### 5. Tích hợp Google Antigravity (tùy chọn)

Habblaud hỗ trợ mặc định **Google Antigravity** (Google DeepMind) mà **không cần cấu hình hay cài thêm plugin nào**:

- **Tự động nhận diện:** Habblaud quét các phiên Antigravity trong `~/.gemini/antigravity` (hoặc `%USERPROFILE%\.gemini\antigravity` trên Windows, hoặc qua biến `HABBLAUD_ANTIGRAVITY_DIRS`).
- **Giám sát hoạt động thời gian thực:** Đọc trực tiếp logs transcript (`brain/<id>/.system_generated/logs/transcript.jsonl`), hiển thị các hoạt động gõ lệnh, đọc code, chỉnh sửa file, tiến độ subagent.
- **Huy hiệu tài khoản AGY:** Nhân vật mang thẻ nhận diện riêng và email được trích xuất tự động từ ứng dụng.
- **Gửi tin nhắn trực tiếp:** Gửi phản hồi và chỉ dẫn tức thì tới phiên làm việc qua lệnh `agentapi send-message`.

---

### Truy cập từ xa & Điều khiển bằng điện thoại

Bạn có thể dễ dàng quản lý văn phòng và các agent ngay trên điện thoại di động:

#### Cách 1: Cloudflare Tunnel & Mã QR Code (Khuyến nghị — Cực nhanh, truy cập ở mọi nơi)

Cách đơn giản và an toàn nhất để truy cập từ điện thoại dù bạn ở cùng mạng Wi-Fi hay đang ra ngoài quán cà phê:

```bash
npm run remote:tunnel
```

- **Tự động 100%:** Tự tải binary `cloudflared` vào thư mục `./bin/`, thiết lập đường hầm mã hóa an toàn và in ra đường link HTTPS công khai `https://*.trycloudflare.com` kèm **mã QR Code ngay trên terminal**.
- **Remote Panel trên Web UI:** Bấm vào biểu tượng **Điện thoại / Remote** trên thanh công cụ hoặc vào **Cài đặt** để xem trạng thái kết nối, quét mã QR SVG động bằng camera điện thoại.
- **Đổi tài khoản mật khẩu trực tiếp:** Dễ dàng đổi Username và Password đăng nhập từ xa ngay trên giao diện web mà không cần sửa file `.env`.
- **Đầy đủ quyền năng:** Duyệt lệnh, trả lời câu hỏi, kiểm tra quota và gửi tin nhắn trực tiếp từ smartphone.

#### Cách 2: Mạng nội bộ với HTTPS & mDNS (`remote:setup`)

Dành cho mạng Wi-Fi nội bộ không cần ra internet:
```bash
npm run remote:setup   # cấu hình user, password, tên địa chỉ local
npm run docker:up      # hoặc npm start
```
Truy cập qua địa chỉ `https://<ten>.local:4748` trên điện thoại sau khi cài chứng chỉ CA do Habblaud tạo.

---

## Hướng dẫn sử dụng

### Ý nghĩa hành động của từng nhân vật

| Trạng thái | Biểu hiện của nhân vật |
| --- | --- |
| **Đang làm việc (Working)** | Ngồi tại bàn, gõ phím. Màn hình máy tính và bóng thoại hiển thị biểu tượng: 📖 đọc file, ✏️ sửa code, 💻 terminal, 🧪 chạy test, 🌐 tìm kiếm web… |
| **Cần bạn (Needs you)** | Chạy vội về bàn và giơ tay nhấp nháy báo động: đang chờ bạn phê duyệt lệnh hoặc trả lời câu hỏi trong terminal. |
| **Chờ lệnh shell (Waiting on shell)** | Kết thúc lượt nhưng để lại câu lệnh đang chạy nền (test, build, deploy...), nhân vật ngồi canh chừng với đồng hồ cát lật trên đầu và terminal hiện tiến độ: ăn bắp rang bơ, sau 3 phút khoanh tay xoay ghế, sau 10 phút đóng mạng nhện, sau 25 phút ngủ gật; khi lệnh chạy xong sẽ đứng dậy tung pháo hoa ăn mừng (hoặc ôm đám mây mưa nếu lệnh lỗi). |
| **Rảnh rỗi (Idle)** | Hoàn thành lượt và đi dạo: lấy cà phê, uống nước, vào nhà vệ sinh, ngồi ghế sofa, lướt điện thoại hoặc soi gương. Nếu có đồng nghiệp rảnh rỗi, họ sẽ tụ tập giải trí (xem TV, chơi game, đánh bóng bàn, tán gẫu, oẳn tù tì). |
| **Subagent hoàn thành** | Đi bộ đến chỗ agent chính đã giao việc, bàn giao thùng kết quả (📦) và đi thang máy rời khỏi văn phòng. |
| **Kết thúc phiên** | Rời khỏi văn phòng; nếu là người cuối cùng trong phòng, nhân vật sẽ tắt đèn trước khi ra thang máy. |

### Giao diện điều khiển

- **Thanh trên cùng (Top bar):** Bộ đếm số phòng, số agent, agent đang làm việc, subagent, lệnh shell đang chạy, số agent cần bạn hỗ trợ và thẻ thống kê hạn mức quota từng tài khoản.
- **Thanh bên (Sidebar):**
  - **Sắp xếp thông minh (Smart Agent Prioritization):** Các agent **đang cần bạn** (cần duyệt quyền, trả lời câu hỏi) và các agent **đang tích cực chạy lệnh/làm việc** luôn được tự động ưu tiên đẩy lên đầu danh sách.
  - **Kéo thả tùy ý:** Bạn có thể kéo thả để sắp xếp vị trí nhân vật theo ý thích, trình duyệt sẽ tự động ghi nhớ vị trí này cho từng phòng.
- **Khung chi tiết agent (Details drawer):** Bấm vào bất kỳ nhân vật nào để xem lịch sử hoạt động, danh sách tác vụ, cây subagent, biểu đồ dòng thời gian và tài nguyên đã tiêu thụ (tokens, chi phí, dòng code sửa đổi, model, git branch).
- **Activity Feed:** Dòng sự kiện cập nhật tất cả hoạt động diễn ra trong toàn bộ tòa nhà.
- **Cài đặt (⚙):** Tùy chỉnh tên, bóng thoại, mức độ đi lại của agent, chu kỳ ngày/đêm, âm lượng và nhạc nền BGM, thông báo đẩy, kết nối remote và chế độ Demo.
- **Phím tắt hữu ích:** `/` tìm kiếm · `F` đi theo agent đang chọn · `T` mở terminal · `L` mở timelapse tua lại ngày · `M` mở Ngày của tôi · `P` chuyển nhanh đến yêu cầu phê duyệt tiếp theo · `O` hoặc `0` góc nhìn toàn cảnh · `Esc` hủy chọn · `+` `-` phóng to thu nhỏ.

### Ngôn ngữ

Giao diện hỗ trợ đầy đủ 5 ngôn ngữ: **Tiếng Việt, Tiếng Anh, Tiếng Bồ Đào Nha, Tiếng Tây Ban Nha và Tiếng Pháp**.
- Mặc định giao diện sẽ tự nhận diện theo ngôn ngữ trình duyệt của bạn. Bạn có thể cố định ngôn ngữ trong **Cài đặt › Ngôn ngữ**.
- Máy chủ và các thông báo sự kiện, câu lệnh tuân theo biến môi trường `HABBLAUD_LANG` (ví dụ: `HABBLAUD_LANG=vi` trong file `.env`).

### Chu kỳ ngày/đêm & Âm thanh mô phỏng

- **Môi trường ngày/đêm:** Tự động điều chỉnh theo giờ địa phương của bạn: rạng sáng ấm áp, ban ngày nắng chiếu qua khung cửa sổ, hoàng hôn cam rực rỡ và ban đêm đường phố lung linh ánh đèn cùng đom đóm trong vườn hoa.
- **Hệ thống âm thanh Procedural Synth (100% không dùng file audio tải về):**
  - **Nhạc nền BGM thư giãn:** Các giai điệu chiptune / lofi nhẹ nhàng được tổng hợp trực tiếp bằng Web Audio API.
  - **Âm thanh tương tác đồ vật:** Bạn có thể nhấp chuột vào máy pha cà phê để nghe tiếng pha nước, gõ vào bàn bóng bàn, máy chơi game arcade, mở cửa sổ hoặc chạm vào chậu cây.
  - **Acoustic Zoom động:** Khi bạn cuộn chuột thu nhỏ camera (zoom out), âm thanh sẽ tự động được lọc qua không gian xa dần và có độ vang nhẹ; khi phóng to (zoom in), âm thanh trở nên sắc nét, sống động ngay trước mắt.
  - **Âm thanh thao tác UI:** Tiếng click êm ái khi bấm nút và chuông báo nổi bật khi agent cần bạn trợ giúp.

### Cửa sổ Terminal

Nhấp vào agent và chọn **Mở terminal** để theo dõi toàn bộ nội dung hội thoại giống như hiển thị trong dòng lệnh: các prompt, câu trả lời, từng lệnh công cụ gọi ra kèm kết quả thực thi theo thời gian thực.
- Hỗ trợ tìm kiếm nhanh trong hội thoại bằng `Ctrl+F` (`⌘F` trên macOS).
- Hỗ trợ lọc chỉ xem câu lệnh của người dùng hoặc ẩn bớt các công cụ.
- Xem lại lịch sử các phiên làm việc trong vòng 7 ngày gần nhất qua biểu tượng đồng hồ ở thanh trên cùng.

### Gửi tin nhắn trực tiếp

Tại thanh nhập liệu ở dưới chân cửa sổ Terminal hoặc trong bảng chi tiết nhân vật, bạn có thể gõ nội dung và nhấn `Enter` để gửi tin nhắn:
- **Claude Code:** Tin nhắn chuyển trực tiếp vào phiên qua plugin `habblaud-mensagens`.
- **OpenAI Codex:** Tin nhắn xếp vào hàng đợi qua lệnh `codex queue` (hỗ trợ đầy đủ cả `codex.exe` và `codex.cmd` trên Windows).
- **Google Antigravity:** Tin nhắn được truyền tức thì vào luồng hội thoại qua `agentapi send-message`.

---

## Quản lý tài khoản & Quota sử dụng

Nếu bạn sử dụng nhiều tài khoản (ví dụ tài khoản cá nhân và tài khoản công ty):
- Habblaud nhận diện từng tài khoản qua các thư mục cấu hình và các lệnh `alias` đặt trong shell (`~/.bashrc`, `~/.zshrc`).
- Thẻ tài khoản hiển thị hạn mức phần trăm đã dùng trong **phiên 5 giờ** và **trong tuần**, đồng thời đếm ngược thời điểm hạn mức sẽ được làm mới.
- Hỗ trợ đầy đủ hạn mức từ Claude Code mod, statusline tap, OpenAI Codex và số lượt turns/token của Google Antigravity.

---

## Cấu hình biến môi trường

Mọi tính năng đều hoạt động hoàn hảo theo mặc định mà không cần tinh chỉnh gì. Khi cần thiết, bạn có thể thiết lập qua file `.env` hoặc biến môi trường hệ thống:

| Biến môi trường | Mặc định | Chức năng |
| --- | --- | --- |
| `HABBLAUD_PORT` | `4747` | Cổng HTTP của máy chủ. |
| `HABBLAUD_HOST` | `127.0.0.1` | Địa chỉ mạng lắng nghe (chế độ Node). |
| `HABBLAUD_BIND` | `127.0.0.1` | Địa chỉ công bố cổng trong Docker (`0.0.0.0` để mở cho mạng nội bộ). |
| `HABBLAUD_LANG` | `pt-BR` / ngôn ngữ máy | Ngôn ngữ thông báo của máy chủ (`vi`, `en`, `pt-BR`, `es`, `fr`). |
| `HABBLAUD_ANTIGRAVITY` | `1` (bật) | Đặt `0` để tắt theo dõi Google Antigravity. |
| `HABBLAUD_ANTIGRAVITY_DIRS` | tự động | Danh sách thư mục Antigravity tùy chỉnh, ngăn cách bởi dấu phẩy. |
| `HABBLAUD_ANTIGRAVITY_BIN` | tự động | Đường dẫn tùy chỉnh đến binary `agentapi` / `agentapi.bat`. |
| `HABBLAUD_CODEX` | `1` (bật) | Đặt `0` để tắt theo dõi OpenAI Codex. |
| `HABBLAUD_CODEX_DIRS` | tự động | Danh sách thư mục Codex tùy chỉnh. |
| `HABBLAUD_TERMINAL` | `1` (bật) | Đặt `0` để tắt tính năng terminal và phê duyệt lệnh. |
| `HABBLAUD_MENSAGENS` | `1` (bật) | Đặt `0` để tắt tính năng gửi tin nhắn từ văn phòng. |
| `HABBLAUD_DEMO` | `0` (tắt) | Đặt `1` để khởi động sẵn các agent mô phỏng demo. |

---

## Cơ chế hoạt động

```
 Thư mục Claude: ~/.claude*/projects/<project>/<session>.jsonl ──┐
 Thư mục Codex: ~/.codex/sessions/**.jsonl ──────────────────────┼──▶ Máy chủ Node ──▶ Mô hình văn phòng ──▶ SSE ──▶ Trình duyệt
 Thư mục Antigravity: ~/.gemini/antigravity/brain/**/logs ───────┘    (quét mỗi 1s)                                (Canvas + UI)
```

- **Ai có mặt trong văn phòng:** Máy chủ theo dõi các file session lock và transcript hoạt động để biết agent nào đang online.
- **Tiến trình chạy nền (Shells):** Các tác vụ terminal chạy lâu được theo dõi thời gian thực với đồng hồ đếm giây.
- **Đồ họa Pixel Art:** Toàn bộ nhân vật, bàn ghế, tường và sàn nhà là tác phẩm pixel art được **dựng bằng thuật toán code**, mang lại độ sắc nét tuyệt đối trên mọi độ phân giải màn hình.

---

## Xử lý sự cố (Troubleshooting)

<details>
<summary><b>Văn phòng trống trơn, không có nhân vật nào</b></summary>

Chỉ những phiên làm việc **đang mở** mới xuất hiện trong văn phòng. Hãy kiểm tra xem bạn đã mở terminal chạy Claude Code, Codex hoặc Antigravity hay chưa, và truy cập `http://localhost:4747/api/health` để xem trạng thái phát hiện tài khoản.

</details>

<details>
<summary><b>Không thấy phiên Google Antigravity xuất hiện</b></summary>

Đảm bảo biến `HABBLAUD_ANTIGRAVITY=0` không bị đặt. Mặc định Habblaud tự quét thư mục `~/.gemini/antigravity` (hoặc `%USERPROFILE%\.gemini\antigravity`). Nếu bạn cài đặt ở đường dẫn khác, hãy đặt `HABBLAUD_ANTIGRAVITY_DIRS=/duong/dan/antigravity`.

</details>

<details>
<summary><b>Cloudflare Tunnel không khởi động được</b></summary>

Hãy chắc chắn rằng máy chủ Habblaud chính đang chạy trên cổng 4747 (`npm start` hoặc `start.bat`). Trong lần đầu tiên chạy `npm run remote:tunnel`, máy cần có kết nối internet để tải file thực thi `cloudflared` vào thư mục `./bin/`.

</details>

<details>
<summary><b>Không mở được trên điện thoại</b></summary>

- Nếu dùng **Cloudflare Tunnel (`npm run remote:tunnel`)**: Bạn chỉ cần quét mã QR Code xuất hiện ở terminal hoặc trong bảng Remote Panel của giao diện web.
- Nếu dùng mạng nội bộ: Kiểm tra điện thoại và máy tính có chung mạng Wi-Fi không, và firewall của máy tính có cho phép kết nối vào cổng 4747/4748 không.

</details>

<details>
<summary><b>Báo lỗi "Cổng 4747 đã được sử dụng"</b></summary>

Có một tiến trình Habblaud khác đang chạy. Bạn có thể tắt tiến trình cũ hoặc chỉ định cổng mới: `HABBLAUD_PORT=4848 npm start`.

</details>

---

## Đời sống xã hội

Khi hai hoặc nhiều agent rảnh rỗi — hoặc đang chờ lệnh shell quá 40 giây — họ sẽ cùng tham gia các hoạt động vui chơi giải trí:
- 📺 **Xem TV phòng chờ:** Xem bóng đá (màn hình chớp chữ VÀO), xem phim truyền hình hoặc hoạt hình cùng bắp rang bơ.
- 🎮 **Chơi game đối kháng:** Hai người cầm tay cầm thi đấu trên màn hình TV chia đôi.
- 👾 **Đấu máy Arcade:** Đọ tài tại hai cỗ máy game thùng cổ điển.
- 🏓 **Đánh bóng bàn:** Trận đấu 5 điểm với tiếng bóng bàn sinh động và đồng nghiệp đứng cổ vũ xung quanh.
- ☕ **Tán gẫu trong bếp:** Cùng ngồi uống cà phê, kể chuyện vui, bàn tán về các commit của đồng nghiệp.
- ✊ **Oẳn tù tì ăn tiền xu (🪙):** "Oẳn tù tì ra cái gì ra cái này!", người thắng nhảy múa ăn mừng, tiền xu bay sang tài khoản người thắng và người thua ấm ức đòi đấu lại.

---

## Giấy phép & Tác quyền (License & Credits)

- **Tác giả gốc & Nhà sáng tạo dự án:** [Márcio Junior (@marmottajr)](https://github.com/marmottajr)
- **Repository gốc trên GitHub:** [https://github.com/marmottajr/habblaud](https://github.com/marmottajr/habblaud)
- **Giấy phép phần mềm:** [MIT License](LICENSE) © 2026 Márcio Junior.
- **Các tính năng mở rộng trong bản fork này:** Tích hợp Google Antigravity, bản dịch giao diện Tiếng Việt, truy cập từ xa một chạm qua Cloudflare Tunnel & QR Code, nâng cấp âm thanh Procedural BGM và các script khởi chạy trên Windows (`start.bat`, `run-silent.vbs`).
- Các tài nguyên hình ảnh pixel-art thương hiệu thuộc bản quyền của dự án gốc.

---

<p align="center">
  Dựa trên dự án gốc của <a href="https://github.com/marmottajr/habblaud">Márcio Junior</a> · Phát triển và đóng góp với niềm đam mê ☕ cùng các trợ lý <a href="https://code.claude.com">Claude Code</a>, <a href="https://github.com/google-deepmind/antigravity">Google Antigravity</a> & Codex.
</p>
