"use client";

import LandingEffects from "@/src/components/LandingEffects";

export default function Home() {
  return (
    <>
      <LandingEffects />
<a className="landing-brand" href="#hero" data-slide="0" aria-label="SoU Technology Solutions — Trang chủ"><img className="landing-brand__logo" src="/client/images/logo.svg" alt="SoU Technology Solutions" loading="eager" decoding="async" /></a>
    <nav className="landing-side-nav" id="landing-side-nav" aria-label="Điều hướng section">
      <ul className="landing-side-nav__list" role="list">
        <li role="listitem">
          <button className="landing-side-nav__btn is-active" type="button" data-slide="0" aria-controls="hero"><span className="landing-side-nav__num">01</span><span className="landing-side-nav__label">Trang Chủ</span><span className="landing-side-nav__dot" aria-hidden="true"></span></button>
        </li>
        <li role="listitem">
          <button className="landing-side-nav__btn" type="button" data-slide="1" aria-controls="why"><span className="landing-side-nav__num">02</span><span className="landing-side-nav__label">Về Chúng Tôi</span><span className="landing-side-nav__dot" aria-hidden="true"></span></button>
        </li>
        <li role="listitem">
          <button className="landing-side-nav__btn" type="button" data-slide="2" aria-controls="capabilities"><span className="landing-side-nav__num">03</span><span className="landing-side-nav__label">Năng Lực</span><span className="landing-side-nav__dot" aria-hidden="true"></span></button>
        </li>
        <li role="listitem">
          <button className="landing-side-nav__btn" type="button" data-slide="3" aria-controls="process"><span className="landing-side-nav__num">04</span><span className="landing-side-nav__label">Quy Trình</span><span className="landing-side-nav__dot" aria-hidden="true"></span></button>
        </li>
        <li role="listitem">
          <button className="landing-side-nav__btn" type="button" data-slide="4" aria-controls="contact"><span className="landing-side-nav__num">05</span><span className="landing-side-nav__label">Liên Hệ</span><span className="landing-side-nav__dot" aria-hidden="true"></span></button>
        </li>
      </ul>
    </nav>
    <div className="landing-side-nav__progress" aria-hidden="true"><span id="landing-slide-progress"></span></div>
    <div className="landing-counter" aria-hidden="true"><span id="landing-slide-current">01</span><span className="landing-counter__sep">/</span><span id="landing-slide-total">05</span></div>
    <button className="landing-sheet-pill" id="landing-sheet-pill" type="button" aria-expanded="false" aria-controls="landing-track" aria-label="Mở nội dung section"><span className="landing-sheet-pill__num" id="landing-sheet-pill-num">01</span><span className="landing-sheet-pill__floor" id="landing-sheet-pill-floor">Lobby</span><span className="landing-sheet-pill__sep" aria-hidden="true">·</span><span className="landing-sheet-pill__title" id="landing-sheet-pill-title">Giải Pháp Công Nghệ</span><span className="landing-sheet-pill__chev" aria-hidden="true"><i className="fa-solid fa-chevron-up"></i></span></button>
    <canvas className="landing-webgl" id="webgl-bg-canvas" aria-hidden="true"></canvas>
    <main className="landing-stage" id="main-content">
      <div className="landing-track" id="landing-track">
        <section className="landing-slide is-active" id="hero" data-slide="0" aria-labelledby="hero-title">
          <div className="container-fluid landing-slide__grid">
            <div className="row align-items-center g-4 g-xl-5 h-100">
              <div className="col-lg-6 landing-slide__copy">
                <div className="landing-slide__content landing-slide__content--hero">
                  <p className="landing-eyebrow landing-eyebrow--rule">Build Tomorrow, Together</p>
                  <h2 className="landing-slide__title" id="hero-title"><span className="landing-slide__title-line">Giải Pháp Công Nghệ</span><span className="landing-slide__title-line landing-slide__title-line--accent">Cho Doanh Nghiệp Tương Lai</span></h2>
                  <p className="landing-slide__desc">Chúng tôi đồng hành cùng doanh nghiệp kiến tạo giải pháp phần mềm hiện đại, tối ưu vận hành và mở ra cơ hội tăng trưởng trong kỷ nguyên số.</p>
                  <div className="landing-slide__actions">
                    <button className="landing-btn landing-btn--primary" type="button" data-slide="2">Khám Phá Dự Án<i className="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
                    <button className="landing-btn landing-btn--ghost" type="button" data-slide="4">Tư Vấn Ngay<i className="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
                  </div>
                  <ul className="landing-features" role="list">
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-shield-halved"></i></span><span className="landing-feature__text"><strong>Bảo mật</strong><small>Chuẩn Enterprise</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-chart-line"></i></span><span className="landing-feature__text"><strong>Hiệu suất cao</strong><small>Sẵn sàng mở rộng</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-cubes"></i></span><span className="landing-feature__text"><strong>Linh hoạt</strong><small>Tùy chỉnh theo nhu cầu</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-handshake"></i></span><span className="landing-feature__text"><strong>Đồng hành</strong><small>Dài hạn &amp; bền vững</small></span></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-6 landing-slide__model" aria-hidden="true">
                <div className="landing-slide__model-slot"></div>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-slide" id="why" data-slide="1" aria-labelledby="why-title">
          <div className="container-fluid landing-slide__grid">
            <div className="row align-items-center g-4 g-xl-5 h-100">
              <div className="col-lg-6 landing-slide__copy">
                <div className="landing-slide__content">
                  <p className="landing-eyebrow landing-eyebrow--rule">Vì Sao Chọn SoU</p>
                  <h2 className="landing-slide__title" id="why-title"><span className="landing-slide__title-line">Ba Giá Trị Cốt Lõi</span><span className="landing-slide__title-line landing-slide__title-line--accent">Kiến Tạo Lòng Tin Dài Hạn</span></h2>
                  <p className="landing-slide__desc">Chúng tôi đặt bảo mật, hiệu năng và tiến độ lên trước — để mỗi dự án chạy ổn định, mở rộng được và bàn giao đúng cam kết.</p>
                  <div className="landing-slide__actions">
                    <button className="landing-btn landing-btn--primary" type="button" data-slide="2">Xem Năng Lực<i className="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
                    <button className="landing-btn landing-btn--ghost" type="button" data-slide="4">Tư Vấn Ngay<i className="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
                  </div>
                  <ul className="landing-features" role="list">
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-shield-halved"></i></span><span className="landing-feature__text"><strong>Bảo mật</strong><small>Chuẩn Enterprise</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-gauge-high"></i></span><span className="landing-feature__text"><strong>Hiệu năng</strong><small>API &lt; 100ms · Scale sẵn</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-calendar-check"></i></span><span className="landing-feature__text"><strong>Tiến độ</strong><small>Demo mỗi 2 tuần</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-file-contract"></i></span><span className="landing-feature__text"><strong>Minh bạch</strong><small>Nghiệm thu theo giai đoạn</small></span></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-6 landing-slide__model" aria-hidden="true">
                <div className="landing-slide__model-slot"></div>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-slide" id="capabilities" data-slide="2" aria-labelledby="caps-title">
          <div className="container-fluid landing-slide__grid">
            <div className="row align-items-center g-4 g-xl-5 h-100">
              <div className="col-lg-6 landing-slide__copy">
                <div className="landing-slide__content">
                  <p className="landing-eyebrow landing-eyebrow--rule">Năng Lực Trọng Tâm</p>
                  <h2 className="landing-slide__title" id="caps-title"><span className="landing-slide__title-line">Dự Án Có Thể</span><span className="landing-slide__title-line landing-slide__title-line--accent">Triển Khai Ngay Hôm Nay</span></h2>
                  <p className="landing-slide__desc">Từ blockchain core đến SaaS và phần mềm theo yêu cầu — đội ngũ SoU sẵn sàng đồng hành từ ý tưởng đến sản phẩm vận hành.</p>
                  <div className="landing-slide__actions">
                    <button className="landing-btn landing-btn--primary" type="button" data-slide="3">Xem Quy Trình<i className="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
                    <button className="landing-btn landing-btn--ghost" type="button" data-slide="4">Nhận Báo Giá<i className="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
                  </div>
                  <ul className="landing-features" role="list">
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-coins"></i></span><span className="landing-feature__text"><strong>Token</strong><small>ERC-20 · Vesting · Staking</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-link"></i></span><span className="landing-feature__text"><strong>Web3</strong><small>dApp · Payment gateway</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-cloud"></i></span><span className="landing-feature__text"><strong>SaaS</strong><small>Multi-tenant · Billing</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-code"></i></span><span className="landing-feature__text"><strong>Custom</strong><small>CRM/ERP · Web &amp; Mobile</small></span></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-6 landing-slide__model" aria-hidden="true">
                <div className="landing-slide__model-slot"></div>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-slide" id="process" data-slide="3" aria-labelledby="process-title">
          <div className="container-fluid landing-slide__grid">
            <div className="row align-items-center g-4 g-xl-5 h-100">
              <div className="col-lg-6 landing-slide__copy">
                <div className="landing-slide__content">
                  <p className="landing-eyebrow landing-eyebrow--rule">Cách Chúng Tôi Làm Việc</p>
                  <h2 className="landing-slide__title" id="process-title"><span className="landing-slide__title-line">Quy Trình 4 Bước</span><span className="landing-slide__title-line landing-slide__title-line--accent">Rõ Ràng &amp; Minh Bạch</span></h2>
                  <p className="landing-slide__desc">Mỗi giai đoạn có đầu ra cụ thể — bạn theo dõi tiến độ thật, nghiệm thu từng phần và nhận bàn giao đầy đủ khi lên production.</p>
                  <div className="landing-slide__actions">
                    <button className="landing-btn landing-btn--primary" type="button" data-slide="4">Bắt Đầu Ngay<i className="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
                    <button className="landing-btn landing-btn--ghost" type="button" data-slide="0">Về Trang Chủ<i className="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
                  </div>
                  <ul className="landing-features" role="list">
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-magnifying-glass-chart"></i></span><span className="landing-feature__text"><strong>Khảo sát</strong><small>Tư vấn &amp; báo giá 24H</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-laptop-code"></i></span><span className="landing-feature__text"><strong>Lập trình</strong><small>Demo chạy thử 2 tuần/lần</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-vial"></i></span><span className="landing-feature__text"><strong>Kiểm thử</strong><small>Load · Security · Staging</small></span></li>
                    <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-gift"></i></span><span className="landing-feature__text"><strong>Bàn giao</strong><small>Source 100% · Bảo hành</small></span></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-6 landing-slide__model" aria-hidden="true">
                <div className="landing-slide__model-slot"></div>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-slide" id="contact" data-slide="4" aria-labelledby="contact-title">
          <div className="container-fluid landing-slide__grid">
            <div className="row align-items-center g-4 g-xl-5 h-100">
              <div className="col-lg-6 landing-slide__copy mt-lg-0">
                <div className="landing-slide__content landing-slide__content--form">
                  <div className="landing-contact-copy">
                    <p className="landing-eyebrow landing-eyebrow--rule">Bắt Đầu Dự Án</p>
                    <h2 className="landing-slide__title" id="contact-title"><span className="landing-slide__title-line">Nhận Báo Giá</span><span className="landing-slide__title-line landing-slide__title-line--accent">Trong Vòng 24 Giờ</span></h2>
                    <p className="landing-slide__desc">Chọn nhu cầu, ngân sách và để lại thông tin — đội ngũ SoU phản hồi giải pháp phù hợp trong ngày làm việc tiếp theo.</p>
                    <ul className="landing-features landing-features--compact" role="list">
                      <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-bolt"></i></span><span className="landing-feature__text"><strong>Phản hồi nhanh</strong><small>Trong 24 giờ làm việc</small></span></li>
                      <li className="landing-feature"><span className="landing-feature__icon" aria-hidden="true"><i className="fa-solid fa-comments"></i></span><span className="landing-feature__text"><strong>Tư vấn miễn phí</strong><small>Không ràng buộc hợp đồng</small></span></li>
                    </ul>
                  </div>
                  <form className="landing-form" id="landing-quote-form" noValidate>
                    <div className="landing-form__row">
                      <div className="landing-field">
                        <label htmlFor="quote-need">Nhu cầu</label>
                        <select id="quote-need" name="need" required={true} defaultValue="">
                          <option value="" disabled>
                            Chọn nhu cầu
                          </option>
                          <option value="token">Token</option>
                          <option value="web3">Web3</option>
                          <option value="saas">SaaS</option>
                          <option value="custom">Custom</option>
                          <option value="dedicated">Thuê Dev</option>
                        </select>
                      </div>
                      <div className="landing-field">
                        <label htmlFor="quote-budget">Ngân sách</label>
                        <select id="quote-budget" name="budget" required={true} defaultValue="lt5k">
                          <option value="lt5k">&lt; $5k</option>
                          <option value="5to15">$5k–$15k</option>
                          <option value="gt15">&gt; $15k</option>
                          <option value="flex">Linh hoạt</option>
                        </select>
                      </div>
                    </div>
                    <div className="landing-form__fields">
                      <div className="landing-field">
                        <label htmlFor="quote-name">Họ tên</label>
                        <input id="quote-name" type="text" name="name" required={true} autoComplete="name" placeholder="Nguyễn Văn A" />
                      </div>
                      <div className="landing-field">
                        <label htmlFor="quote-contact">Email / SĐT / Telegram</label>
                        <input id="quote-contact" type="text" name="contact" required={true} autoComplete="email" placeholder="you@email.com" />
                      </div>
                      <div className="landing-field landing-field--full">
                        <label htmlFor="quote-idea">Ý tưởng</label>
                        <textarea id="quote-idea" name="idea" rows={2} required={true} placeholder="Mô tả ngắn sản phẩm hoặc bài toán…"></textarea>
                      </div>
                    </div>
                    <p className="landing-form__status" id="landing-form-status" role="status" aria-live="polite" hidden={true}></p>
                    <button className="landing-btn landing-btn--primary landing-form__submit" type="submit">Gửi Yêu Cầu — Báo Giá 24H</button>
                  </form>
                </div>
              </div>
              <div className="col-lg-6 landing-slide__model" aria-hidden="true">
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
