/** 首页 — 寻亲广场轮播（每次显示 3 张）+ 详情弹窗 */
(function () {
  const { initNav } = window.Xunqin;
  initNav();

  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const emptyEl = document.getElementById('carousel-empty');
  const modal = document.getElementById('detail-modal');
  if (!track) return;

  let childrenData = [];
  let slideIndex = 0;

  function getVisibleCount() {
    const w = window.innerWidth;
    if (w <= 640) return 1;
    if (w <= 900) return 2;
    return 3;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    const el = document.createElement('div');
    el.textContent = String(str);
    return el.innerHTML;
  }

  function genderSymbol(gender) {
    if (gender === '男') return '♂';
    if (gender === '女') return '♀';
    return '·';
  }

  function cardSummary(child) {
    const parts = [];
    if (child.missingPlace) parts.push(child.missingPlace);
    if (child.missingDate) parts.push(`失踪于 ${child.missingDate}`);
    if (parts.length) return parts.join('，');
    if (child.features && child.features !== '无') return child.features;
    return '详情请点击查看';
  }

  function renderCard(child, index) {
    const name = escapeHtml(child.name || '未知');
    const image = escapeHtml(child.image || '');
    const summary = escapeHtml(cardSummary(child));
    const gender = escapeHtml(genderSymbol(child.gender));

    return `
      <article class="plaza-card" data-index="${index}" tabindex="0" role="button" aria-label="查看${name}寻亲信息">
        <div class="plaza-card__media">
          <img
            src="${image}"
            alt="${name}寻亲照片"
            loading="lazy"
            onload="this.parentElement.querySelector('.plaza-card__placeholder').style.display='none'"
            onerror="this.style.visibility='hidden';this.parentElement.querySelector('.plaza-card__placeholder').style.display='flex'"
          />
          <span class="plaza-card__placeholder">加载中</span>
        </div>
        <div class="plaza-card__foot">
          <span class="plaza-card__gender" aria-hidden="true">${gender}</span>
          <h3 class="plaza-card__name">${name}</h3>
          <p class="plaza-card__desc">${summary}</p>
        </div>
      </article>
    `;
  }

  function maxSlideIndex() {
    return Math.max(0, childrenData.length - getVisibleCount());
  }

  function updateCarousel() {
    const card = track.querySelector('.plaza-card');
    if (!card) return;

    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const step = card.offsetWidth + gap;
    track.style.transform = `translateX(${-slideIndex * step}px)`;

    const atStart = slideIndex <= 0;
    const atEnd = slideIndex >= maxSlideIndex();
    if (prevBtn) {
      prevBtn.disabled = atStart;
      prevBtn.setAttribute('aria-disabled', String(atStart));
    }
    if (nextBtn) {
      nextBtn.disabled = atEnd;
      nextBtn.setAttribute('aria-disabled', String(atEnd));
    }
  }

  function fieldRow(label, value) {
    if (!value) return '';
    return `
      <div class="detail-row">
        <dt>${escapeHtml(label)}</dt>
        <dd>${escapeHtml(value)}</dd>
      </div>
    `;
  }

  function openDetail(child) {
    if (!modal) return;
    const title = document.getElementById('detail-title');
    const body = document.getElementById('detail-body');
    const footer = document.getElementById('detail-footer');
    const imgSrc = escapeHtml(child.image);
    const imgAlt = escapeHtml(child.name || '寻亲照片');

    if (child.name) {
      if (title) {
        title.textContent = `寻找${child.relation || ''} ${child.name}`.replace(/\s+/g, ' ').trim();
      }
      if (body) {
        body.className = 'detail-body';
        body.innerHTML = `
          <img class="detail-photo" src="${imgSrc}" alt="${imgAlt}" />
          <div class="detail-fields">
            ${fieldRow('姓名', child.name)}
            ${fieldRow('性别', child.gender)}
            ${fieldRow('出生日期', child.birthday)}
            ${fieldRow('失踪时身高', child.height)}
            ${fieldRow('失踪时间', child.missingDate)}
            ${fieldRow('失踪地点', child.missingPlace)}
            <div class="detail-features">
              <h3>特征描述</h3>
              <p>${escapeHtml(child.features || '暂无')}</p>
            </div>
          </div>
        `;
      }
      if (footer) {
        footer.innerHTML = child.searchId
          ? `寻亲编号：<strong>${escapeHtml(child.searchId)}</strong>`
          : '';
        footer.style.display = child.searchId ? '' : 'none';
      }
    } else {
      if (title) title.textContent = '寻亲照片';
      if (body) {
        body.className = 'detail-body detail-body--photo-only';
        body.innerHTML = `<img class="detail-photo detail-photo--full" src="${imgSrc}" alt="${imgAlt}" />`;
      }
      if (footer) {
        footer.innerHTML = '';
        footer.style.display = 'none';
      }
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
    const footer = document.getElementById('detail-footer');
    if (footer) footer.style.display = '';
  }

  function bindCardEvents() {
    track.querySelectorAll('.plaza-card').forEach((card) => {
      const index = Number(card.dataset.index);
      card.addEventListener('click', () => openDetail(childrenData[index]));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail(childrenData[index]);
        }
      });
    });
  }

  function bindCarouselControls() {
    prevBtn?.addEventListener('click', () => {
      slideIndex = Math.max(0, slideIndex - 1);
      updateCarousel();
    });
    nextBtn?.addEventListener('click', () => {
      slideIndex = Math.min(maxSlideIndex(), slideIndex + 1);
      updateCarousel();
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        slideIndex = Math.min(slideIndex, maxSlideIndex());
        updateCarousel();
      }, 120);
    });
  }

  function showEmpty() {
    track.innerHTML = '';
    document.querySelector('.home-carousel')?.setAttribute('hidden', '');
    if (emptyEl) emptyEl.hidden = false;
  }

  function renderThumb(item) {
    const type = escapeHtml(item.thumbType || 'default');
    const fallbackClass = `thumb-fallback thumb--${type}`;
    if (!item.thumb) {
      return `<span class="home-news-item__thumb ${fallbackClass}" aria-hidden="true"></span>`;
    }
    const src = escapeHtml(item.thumb);
    return `
      <span class="home-news-item__thumb home-news-item__thumb--photo">
        <img
          src="${src}"
          alt=""
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="this.remove();this.parentElement.className='home-news-item__thumb ${fallbackClass}'"
        />
      </span>
    `;
  }

  function renderNewsItem(item) {
    const title = escapeHtml(item.title);
    const summary = escapeHtml(item.summary);
    const url = escapeHtml(item.url);
    const metaParts = [];
    if (item.source) metaParts.push(escapeHtml(item.source));
    if (item.date) metaParts.push(escapeHtml(item.date));
    const meta = metaParts.length
      ? `<span class="home-news-item__meta">${metaParts.join(' · ')}</span>`
      : '';

    return `
      <li class="home-news-item">
        <a class="home-news-item__link" href="${url}" target="_blank" rel="noopener noreferrer">
          ${renderThumb(item)}
          <div class="home-news-item__body">
            <h3>${title}</h3>
            <p>${summary}</p>
            ${meta}
          </div>
        </a>
      </li>
    `;
  }

  function loadNews() {
    const newsList = document.getElementById('news-list');
    const guideList = document.getElementById('guide-list');
    if (!newsList && !guideList) return;

    fetch('data/news.json')
      .then((res) => res.json())
      .then((data) => {
        if (newsList && data.news?.length) {
          newsList.innerHTML = data.news.map(renderNewsItem).join('');
        }
        if (guideList && data.guides?.length) {
          guideList.innerHTML = data.guides.map(renderNewsItem).join('');
        }
      })
      .catch(() => {});
  }

  loadNews();

  fetch('data/children.json')
    .then((res) => res.json())
    .then((children) => {
      childrenData = children;
      if (!children.length) {
        showEmpty();
        return;
      }

      track.innerHTML = children.map(renderCard).join('');
      slideIndex = 0;
      bindCardEvents();
      bindCarouselControls();
      updateCarousel();
    })
    .catch(() => {
      showEmpty();
    });

  document.getElementById('detail-close')?.addEventListener('click', closeDetail);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeDetail();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetail();
  });
})();
