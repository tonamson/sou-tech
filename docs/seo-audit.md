# Frontend SEO audit — 2026-09-15

## Kết luận

Frontend đã có title, mô tả, tiếng Việt (`lang="vi"`), một H1 và các H2 rõ ràng. Các phần còn thiếu về URL chuẩn, crawler discovery và chia sẻ mạng xã hội đã được bổ sung. Đánh giá này dựa trên code và bản production chạy local, chưa xác nhận tình trạng index hay Core Web Vitals của domain production.

| Hạng mục | Trước | Sau |
| --- | --- | --- |
| Canonical | Chưa có | Trang chủ dùng `https://soutechnology.vn/` |
| Robots / sitemap | Trả 404 | Hai endpoint trả 200, cùng domain chuẩn |
| Chia sẻ link | Thiếu OG/Twitter | Title, mô tả, locale và ảnh PNG 1200×630 |
| Dữ liệu có cấu trúc | Chưa có | JSON-LD Organization và WebSite, dựa trên thông tin thật trong trang |
| Nội dung HTML | Cả trang nằm trong client boundary | Nội dung là Server Component, chỉ hiệu ứng cần client |
| Điều hướng | Nút phụ thuộc JavaScript | Anchor có href, hỗ trợ fragment, tải trực tiếp và Back |
| Không có JavaScript | Nội dung bị CSS và loading che | Nội dung xếp dọc, liên kết cuộn được trên desktop/mobile |
| Loading 3D | Loader tự tắt sau 4–4,5 giây; 3D bắt đầu tải ở giây 5 | Tải 3D trong lúc loading, chờ asset và khung hình đầu tiên; intro 1,8 giây lần đầu và 0,8 giây lần sau |

`use client` trước đây không đồng nghĩa trang không có HTML render từ server. Việc thu nhỏ client boundary giảm phần nội dung cần hydrate; vấn đề đọc khi tắt JavaScript chủ yếu nằm ở CSS và loading.

## Ưu tiên trải nghiệm 3D

Giữ intro loading tối thiểu 4 giây theo trải nghiệm đang có. Chỉ bắt đầu fade-out khi cả intro và khung hình 3D đầu tiên đã sẵn sàng. Không dùng timeout để mở một cảnh trống. Nếu tải module hoặc dựng cảnh thất bại, hiển thị thông báo cùng nút tải lại.

Mobile vẫn mở đầu bằng cảnh 3D, người xem mở bảng nội dung bằng nút ở dưới. Truy cập thẳng vào fragment hoặc bấm liên kết nội dung sẽ mở mục tương ứng.

Loading toàn màn hình vẫn là một đánh đổi về thời gian tiếp cận nội dung; chưa có đo lường thiết bị thật để khẳng định đạt Core Web Vitals. Google xem xét nhiều khía cạnh của [page experience](https://developers.google.com/search/docs/appearance/page-experience), không có một điểm SEO duy nhất bảo đảm thứ hạng.

## Kiểm chứng

- `npm run build`: đạt, trang chủ và metadata routes được tạo tĩnh.
- `npm run test:seo`: 7/7 đạt; trước sửa 6/7 thất bại đúng các phần còn thiếu.
- ESLint trên các file thay đổi: không có lỗi; còn 8 cảnh báo đã có về stylesheet và biến/hàm chưa dùng.
- Chromium desktop 1440×900 và mobile 390×844: đạt với JavaScript bật/tắt, anchor, Back, deep link và email.
- Cố tình trì hoãn chunk 3D 6,5 giây: loading vẫn hiện sau mốc 4,5 giây; chỉ đóng sau khung hình đầu tiên.
- Cố tình chặn chunk 3D: thông báo thử lại hiện, loading không mở ra cảnh trống.
- Đã xem ảnh chụp desktop/mobile sau loading để xác nhận mô hình 3D có mặt.
- Google Rich Results Test (15/09/2026): crawl production thành công, phát hiện `Organization` hợp lệ, không báo lỗi; Google hiển thị URL, logo, mô tả và email của SoU.
- Google PageSpeed Insights đã tạo báo cáo mobile cho URL production, nhưng phiên Lighthouse giữ ở trạng thái “Chẩn đoán các vấn đề về hiệu suất” và không trả điểm trong lần chạy này. Vì vậy không ghi nhận điểm số giả; cần chạy lại sau khi endpoint ổn định.

Chạy lại kiểm tra HTTP sau khi build và bật server production:

```sh
cd frontend
npm run build
npm run start -- --port 3100
# Trong terminal khác, cùng thư mục frontend:
npm run test:seo
```

Có thể đổi đích kiểm tra bằng `SEO_BASE_URL`. Domain SEO được quản lý tập trung trong `frontend/src/lib/site.ts`.

## Sau khi deploy

1. Kiểm tra HTTPS và redirect các hostname phụ về domain canonical tại hosting/CDN.
2. Xác minh Search Console, gửi `/sitemap.xml`, dùng URL Inspection kiểm tra HTML Google render.
3. Đo PageSpeed/Core Web Vitals trên thiết bị thật, đặc biệt thời gian dựng 3D trên mobile.
4. Khi có nội dung thực tế, bổ sung trang riêng cho từng dịch vụ và case study. Các fragment của landing hiện tại là một trang, không phải năm trang độc lập.

Các liên kết dùng anchor thực theo [hướng dẫn Google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable). Metadata, robots, sitemap và JSON-LD dùng API có sẵn trong Next.js 16.3.4, đối chiếu tài liệu cài kèm trong `frontend/node_modules/next/dist/docs`.
