"use client";

import LandingEffects from "@/src/components/LandingEffects";

export default function Home() {
  return (
    <>
      <LandingEffects />
      <a
        className="landing-brand"
        href="#hero"
        data-slide="0"
        aria-label="SoU Technology Solutions — Trang chủ">
        <img
          className="landing-brand__logo"
          src="/client/images/logo.svg"
          alt="SoU Technology Solutions"
          loading="eager"
          decoding="async"
        />
      </a>
      <nav
        className="landing-side-nav"
        id="landing-side-nav"
        aria-label="Điều hướng section">
        <ul className="landing-side-nav__list" role="list">
          <li role="listitem">
            <button
              className="landing-side-nav__btn is-active"
              type="button"
              data-slide="0"
              aria-controls="hero">
              <span className="landing-side-nav__num">01</span>
              <span className="landing-side-nav__label">Trang Chủ</span>
              <span className="landing-side-nav__dot" aria-hidden="true"></span>
            </button>
          </li>
          <li role="listitem">
            <button
              className="landing-side-nav__btn"
              type="button"
              data-slide="1"
              aria-controls="why">
              <span className="landing-side-nav__num">02</span>
              <span className="landing-side-nav__label">Về Chúng Tôi</span>
              <span className="landing-side-nav__dot" aria-hidden="true"></span>
            </button>
          </li>
          <li role="listitem">
            <button
              className="landing-side-nav__btn"
              type="button"
              data-slide="2"
              aria-controls="capabilities">
              <span className="landing-side-nav__num">03</span>
              <span className="landing-side-nav__label">Năng Lực</span>
              <span className="landing-side-nav__dot" aria-hidden="true"></span>
            </button>
          </li>
          <li role="listitem">
            <button
              className="landing-side-nav__btn"
              type="button"
              data-slide="3"
              aria-controls="process">
              <span className="landing-side-nav__num">04</span>
              <span className="landing-side-nav__label">Quy Trình</span>
              <span className="landing-side-nav__dot" aria-hidden="true"></span>
            </button>
          </li>
          <li role="listitem">
            <button
              className="landing-side-nav__btn"
              type="button"
              data-slide="4"
              aria-controls="contact">
              <span className="landing-side-nav__num">05</span>
              <span className="landing-side-nav__label">Liên Hệ</span>
              <span className="landing-side-nav__dot" aria-hidden="true"></span>
            </button>
          </li>
        </ul>
      </nav>
      <div className="landing-side-nav__progress" aria-hidden="true">
        <span id="landing-slide-progress"></span>
      </div>
      <div className="landing-counter" aria-hidden="true">
        <span id="landing-slide-current">01</span>
        <span className="landing-counter__sep">/</span>
        <span id="landing-slide-total">05</span>
      </div>
      <button
        className="landing-sheet-pill"
        id="landing-sheet-pill"
        type="button"
        aria-expanded="false"
        aria-controls="landing-track"
        aria-label="Mở nội dung section">
        <span className="landing-sheet-pill__num" id="landing-sheet-pill-num">
          01
        </span>
        <span
          className="landing-sheet-pill__floor"
          id="landing-sheet-pill-floor">
          Lobby
        </span>
        <span className="landing-sheet-pill__sep" aria-hidden="true">
          ·
        </span>
        <span
          className="landing-sheet-pill__title"
          id="landing-sheet-pill-title">
          Giải Pháp Công Nghệ
        </span>
        <span className="landing-sheet-pill__chev" aria-hidden="true">
          <i className="fa-solid fa-chevron-up"></i>
        </span>
      </button>
      <canvas
        className="landing-webgl"
        id="webgl-bg-canvas"
        aria-hidden="true"></canvas>
      <main className="landing-stage" id="main-content">
        <div className="landing-track" id="landing-track">
          <section
            className="landing-slide is-active"
            id="hero"
            data-slide="0"
            aria-labelledby="hero-title">
            <div className="container-fluid landing-slide__grid">
              <div className="row align-items-center g-4 g-xl-5 h-100">
                <div className="col-lg-6 landing-slide__copy">
                  <div className="landing-slide__content landing-slide__content--hero">
                    <p className="landing-eyebrow landing-eyebrow--rule">
                      Your vision. Our expertise.
                    </p>
                    <h2 className="landing-slide__title" id="hero-title">
                      <span className="landing-slide__title-line">
                        Giải Pháp Công Nghệ
                      </span>
                      <span className="landing-slide__title-line landing-slide__title-line--accent">
                        Cho Doanh Nghiệp Tương Lai
                      </span>
                    </h2>
                    <p className="landing-slide__desc">
                      Chúng tôi đồng hành cùng doanh nghiệp kiến tạo giải pháp
                      phần mềm hiện đại, tối ưu vận hành và mở ra cơ hội tăng
                      trưởng trong kỷ nguyên số.
                    </p>
                    <div className="landing-slide__actions">
                      <button
                        className="landing-btn landing-btn--primary"
                        type="button"
                        data-slide="2">
                        Khám Phá Dự Án
                        <i
                          className="fa-solid fa-arrow-right"
                          aria-hidden="true"></i>
                      </button>
                      <button
                        className="landing-btn landing-btn--ghost"
                        type="button"
                        data-slide="4">
                        Tư Vấn Ngay
                        <i
                          className="fa-solid fa-arrow-right"
                          aria-hidden="true"></i>
                      </button>
                    </div>
                    <ul className="landing-features" role="list">
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-shield-halved"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Bảo mật</strong>
                          <small>Chuẩn Enterprise</small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-chart-line"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Hiệu suất cao</strong>
                          <small>Sẵn sàng mở rộng</small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-cubes"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Linh hoạt</strong>
                          <small>Tùy chỉnh theo nhu cầu</small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-handshake"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Đồng hành</strong>
                          <small>Dài hạn &amp; bền vững</small>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div
                  className="col-lg-6 landing-slide__model"
                  aria-hidden="true">
                  <div className="landing-slide__model-slot"></div>
                </div>
              </div>
            </div>
          </section>
          <section
            className="landing-slide"
            id="why"
            data-slide="1"
            aria-labelledby="why-title">
            <div className="container-fluid landing-slide__grid">
              <div className="row align-items-center g-4 g-xl-5 h-100">
                <div className="col-lg-6 landing-slide__copy">
                  <div className="landing-slide__content">
                    <p className="landing-eyebrow landing-eyebrow--rule">
                      Về SoU
                    </p>
                    <h2 className="landing-slide__title" id="why-title">
                      <span className="landing-slide__title-line">
                        Đối tác công nghệ
                      </span>
                      <span className="landing-slide__title-line landing-slide__title-line--accent">
                        Đồng hành cùng doanh nghiệp
                      </span>
                    </h2>
                    <p className="landing-slide__desc">
                      SoU là công ty phát triển phần mềm, giúp doanh nghiệp hiện
                      thực hóa ý tưởng và giải quyết bài toán vận hành bằng công
                      nghệ.
                    </p>
                    <div className="landing-slide__actions">
                      <button
                        className="landing-btn landing-btn--primary"
                        type="button"
                        data-slide="2">
                        Xem năng lực
                        <i
                          className="fa-solid fa-arrow-right"
                          aria-hidden="true"></i>
                      </button>
                      <button
                        className="landing-btn landing-btn--ghost"
                        type="button"
                        data-slide="4">
                        Trao đổi dự án
                        <i
                          className="fa-solid fa-arrow-right"
                          aria-hidden="true"></i>
                      </button>
                    </div>
                    <ul className="landing-features" role="list">
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-comments"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Hiểu nghiệp vụ</strong>
                          <small>Giải pháp xuất phát từ nhu cầu thực tế.</small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-vial"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Chú trọng chất lượng</strong>
                          <small>Kiểm thử trước khi bàn giao.</small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-file-contract"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Hợp tác minh bạch</strong>
                          <small>Thống nhất phạm vi, tiến độ và chi phí.</small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-handshake"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Đồng hành lâu dài</strong>
                          <small>Hỗ trợ vận hành và phát triển sản phẩm.</small>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div
                  className="col-lg-6 landing-slide__model"
                  aria-hidden="true">
                  <div className="landing-slide__model-slot"></div>
                </div>
              </div>
            </div>
          </section>
          <section
            className="landing-slide"
            id="capabilities"
            data-slide="2"
            aria-labelledby="caps-title">
            <div className="container-fluid landing-slide__grid">
              <div className="row align-items-center g-4 g-xl-5 h-100">
                <div className="col-lg-6 landing-slide__copy">
                  <div className="landing-slide__content">
                    <p className="landing-eyebrow landing-eyebrow--rule">
                      Năng lực phát triển
                    </p>
                    <h2 className="landing-slide__title" id="caps-title">
                      <span className="landing-slide__title-line">
                        Phát triển phần mềm
                      </span>
                      <span className="landing-slide__title-line landing-slide__title-line--accent">
                        Theo yêu cầu doanh nghiệp
                      </span>
                    </h2>
                    <p className="landing-slide__desc">
                      SoU phát triển phần mềm theo yêu cầu, nền tảng SaaS và
                      giải pháp Blockchain &amp; Web3 cho doanh nghiệp.
                    </p>
                    <div className="landing-slide__actions">
                      <button
                        className="landing-btn landing-btn--primary"
                        type="button"
                        data-slide="4">
                        Trao đổi dự án
                        <i
                          className="fa-solid fa-arrow-right"
                          aria-hidden="true"></i>
                      </button>
                      <button
                        className="landing-btn landing-btn--ghost"
                        type="button"
                        data-slide="3">
                        Xem quy trình
                        <i
                          className="fa-solid fa-arrow-right"
                          aria-hidden="true"></i>
                      </button>
                    </div>
                    <ul className="landing-features" role="list">
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-code"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Phần mềm theo yêu cầu</strong>
                          <small>
                            Ứng dụng web, mobile và hệ thống quản trị doanh
                            nghiệp.
                          </small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-cloud"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Thiết kế &amp; phát triển SaaS</strong>
                          <small>
                            Nền tảng SaaS, quản lý khách hàng và gói thuê bao.
                          </small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-link"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Blockchain &amp; Web3</strong>
                          <small>
                            Smart contract ERC-20 và website Web3 theo yêu cầu.
                          </small>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div
                  className="col-lg-6 landing-slide__model"
                  aria-hidden="true">
                  <div className="landing-slide__model-slot"></div>
                </div>
              </div>
            </div>
          </section>
          <section
            className="landing-slide"
            id="process"
            data-slide="3"
            aria-labelledby="process-title">
            <div className="container-fluid landing-slide__grid">
              <div className="row align-items-center g-4 g-xl-5 h-100">
                <div className="col-lg-6 landing-slide__copy">
                  <div className="landing-slide__content">
                    <p className="landing-eyebrow landing-eyebrow--rule">
                      Cách Chúng Tôi Làm Việc
                    </p>
                    <h2 className="landing-slide__title" id="process-title">
                      <span className="landing-slide__title-line">
                        Quy Trình 4 Bước
                      </span>
                      <span className="landing-slide__title-line landing-slide__title-line--accent">
                        Rõ Ràng &amp; Minh Bạch
                      </span>
                    </h2>
                    <p className="landing-slide__desc">
                      Mỗi giai đoạn có đầu ra cụ thể — bạn theo dõi tiến độ
                      thật, nghiệm thu từng phần và nhận bàn giao đầy đủ khi lên
                      production.
                    </p>
                    <div className="landing-slide__actions">
                      <button
                        className="landing-btn landing-btn--primary"
                        type="button"
                        data-slide="4">
                        Bắt Đầu Ngay
                        <i
                          className="fa-solid fa-arrow-right"
                          aria-hidden="true"></i>
                      </button>
                      <button
                        className="landing-btn landing-btn--ghost"
                        type="button"
                        data-slide="0">
                        Về Trang Chủ
                        <i
                          className="fa-solid fa-arrow-right"
                          aria-hidden="true"></i>
                      </button>
                    </div>
                    <ul className="landing-features" role="list">
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-magnifying-glass-chart"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Khảo sát</strong>
                          <small>Tư vấn &amp; báo giá 24H</small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-laptop-code"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Lập trình</strong>
                          <small>Demo chạy thử 2 tuần/lần</small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-vial"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Kiểm thử</strong>
                          <small>Load · Security · Staging</small>
                        </span>
                      </li>
                      <li className="landing-feature">
                        <span
                          className="landing-feature__icon"
                          aria-hidden="true">
                          <i className="fa-solid fa-gift"></i>
                        </span>
                        <span className="landing-feature__text">
                          <strong>Bàn giao</strong>
                          <small>Source 100% · Bảo hành</small>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div
                  className="col-lg-6 landing-slide__model"
                  aria-hidden="true">
                  <div className="landing-slide__model-slot"></div>
                </div>
              </div>
            </div>
          </section>
          <section
            className="landing-slide"
            id="contact"
            data-slide="4"
            aria-labelledby="contact-title">
            <div className="container-fluid landing-slide__grid">
              <div className="row align-items-center g-4 g-xl-5 h-100">
                <div className="col-lg-6 landing-slide__copy mt-lg-0">
                  <div className="landing-slide__content">
                    <div className="landing-contact-copy">
                      <p className="landing-eyebrow landing-eyebrow--rule">Liên hệ SoU</p>
                      <h2 className="landing-slide__title" id="contact-title">
                        <span className="landing-slide__title-line">Cùng trao đổi</span>
                        <span className="landing-slide__title-line landing-slide__title-line--accent">Giải pháp cho doanh nghiệp</span>
                      </h2>
                      <p className="landing-slide__desc">
                        Kết nối với SoU để tư vấn phát triển phần mềm, nền tảng SaaS
                        và giải pháp Blockchain &amp; Web3.
                      </p>
                      <div className="landing-contact-email">
                        <span className="landing-contact-email__label">Trao đổi trực tiếp với chúng tôi</span>
                        <a className="landing-contact-email__address" href="mailto:contact@soutechnology.vn">
                          contact@soutechnology.vn
                          <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                        </a>
                        <p>Chia sẻ ngắn gọn nhu cầu hoặc gửi tài liệu dự án qua email.</p>
                        <a className="landing-btn landing-btn--primary" href="mailto:contact@soutechnology.vn">
                          Gửi email cho SoU
                          <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                        </a>
                      </div>
                      <div className="landing-contact-advice">
                        <h3>SoU tư vấn cùng bạn</h3>
                        <ul>
                          <li><strong>Làm rõ nhu cầu</strong><span>Xác định mục tiêu và tính năng cần thiết.</span></li>
                          <li><strong>Đề xuất giải pháp</strong><span>Định hướng công nghệ phù hợp với nghiệp vụ.</span></li>
                          <li><strong>Thống nhất triển khai</strong><span>Trao đổi phạm vi, thời gian và ngân sách dự kiến.</span></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="col-lg-6 landing-slide__model"
                  aria-hidden="true">
                  <div className="landing-slide__model-slot"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
