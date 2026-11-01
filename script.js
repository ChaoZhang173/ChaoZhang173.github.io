(() => {
  const content = window.SITE_CONTENT || {};
  const languagePreferenceKey = 'chao-homepage-language-v2';
  let language = content.defaultLanguage === 'zh' ? 'zh' : 'en';
  // Editor previews use the site's configured default, independent of browser preferences.
  const standalonePage = window.self === window.top;
  try {
    const preference = standalonePage ? localStorage.getItem(languagePreferenceKey) : null;
    if (preference === 'en' || preference === 'zh') language = preference;
  } catch (_) {}
  const languageButton = document.querySelector('.language');
  const profile = content.profile || {};
  const list = value => Array.isArray(value) ? value : [];
  const textValue = value => typeof value === 'string' ? value : '';
  function setTranslation(node, values) {
    const text = typeof values === 'string' ? {zh: values, en: values} : values;
    node.dataset.zh = textValue(text?.zh) || textValue(text?.en);
    node.dataset.en = textValue(text?.en) || textValue(text?.zh);
  }
  function translated(tag, values, className) {
    const node = document.createElement(tag);
    setTranslation(node, values);
    if (className) node.className = className;
    return node;
  }
  function safeUrl(value, image = false) {
    const url = textValue(value).trim();
    if (!url || /[\u0000-\u001f\u007f]/.test(url)) return '';
    if (!/^[a-z][a-z\d+.-]*:/i.test(url)) return url;
    if (/^https?:/i.test(url)) return url;
    if (!image && /^mailto:/i.test(url)) return url;
    if (!image && /^data:application\/pdf;base64,[A-Za-z0-9+/]+=*$/i.test(url)) return url;
    if (image && (/^blob:/i.test(url) || /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,/i.test(url))) return url;
    return '';
  }
  function applyLink(link, value) {
    const url = safeUrl(value);
    if (url) link.href = url;
    else link.removeAttribute('href');
    return Boolean(url);
  }
  function tagList(values) {
    const tags = document.createElement('div');
    tags.className = 'tags';
    list(values).forEach(value => {
      const tag = document.createElement('span');
      tag.textContent = textValue(value);
      tags.append(tag);
    });
    return tags;
  }
  function projectMedia(key, research = false) {
    const hints = {
      snake: {zh:'架构 / 测试结果',en:'Architecture / benchmark'},
      mri: {zh:'系统 / 重建结果',en:'System / reconstruction'},
      inverse: {zh:'模型 / 实验结果',en:'Model / experiment'},
      solver: {zh:'方法 / 数值结果',en:'Method / numerical result'}
    };
    const figure = document.createElement('figure');
    figure.className = 'media-slot project-media';
    figure.dataset.media = textValue(key);
    const placeholder = document.createElement('div');
    placeholder.className = 'media-placeholder';
    placeholder.append(
      translated('span', {zh:research ? '项目图片' : '作品图片',en:'Project image'}, 'media-title'),
      translated('span', research && hints[key] ? hints[key] : {zh:'界面 / 截图 / 演示',en:'Interface / screenshot / demo'}, 'media-hint')
    );
    figure.append(placeholder);
    return figure;
  }
  document.querySelectorAll('[data-profile]').forEach(node => {
    const field = node.dataset.profile;
    if (field === 'identity') {
      node.textContent = textValue(profile.name);
      const chineseName = document.createElement('span');
      chineseName.textContent = textValue(profile.chineseName);
      node.append(chineseName);
    } else if (field === 'focus') {
      list(profile.focus).forEach((focus, index) => {
        if (index) node.append(document.createElement('br'));
        node.append(document.createTextNode(textValue(focus)));
      });
    } else if (field === 'career') {
      setTranslation(node, profile.career);
    } else if (field === 'copyright') {
      node.textContent = '© ' + new Date().getFullYear() + ' ' + textValue(profile.name);
    } else if (field === 'contactEmail') {
      node.textContent = textValue(profile.email) + (profile.email ? ' ↗' : '');
    } else {
      node.textContent = textValue(profile[field]);
    }
  });
  document.querySelectorAll('[data-profile-link]').forEach(link => {
    const field = link.dataset.profileLink;
    const value = field === 'email' && profile.email ? 'mailto:' + profile.email : profile[field];
    if (!applyLink(link, value)) link.style.display = 'none';
  });
  const memorial = content.memorial;
  document.querySelectorAll('[data-memorial]').forEach(card => {
    const imageUrl = safeUrl(memorial?.image?.src, true);
    const hasCopy = memorial?.title?.zh || memorial?.title?.en || memorial?.text?.zh || memorial?.text?.en;
    if (!memorial?.enabled || (!hasCopy && !imageUrl)) return;
    if (memorial.title?.zh || memorial.title?.en) card.append(translated('h2', memorial.title, 'memorial-title'));
    if (memorial.text?.zh || memorial.text?.en) card.append(translated('p', memorial.text, 'memorial-text'));
    if (imageUrl) {
      const figure = document.createElement('figure');
      figure.className = 'memorial-photo';
      reservePhotoSpace(figure, memorial.image);
      const image = imageElement(memorial.image);
      image.addEventListener('error', () => figure.remove());
      figure.append(image);
      card.append(figure);
      image.src = imageUrl;
    }
    card.hidden = false;
    card.closest('.profile')?.classList.add('has-memorial');
  });
  document.querySelectorAll('[data-intro]').forEach(node => setTranslation(node, content.intro?.[node.dataset.intro]));
  document.querySelectorAll('[data-page-text]').forEach(node => {
    const key = node.dataset.pageText;
    if (!Object.prototype.hasOwnProperty.call(content.pageText || {}, key)) return;
    const values = content.pageText[key];
    // An explicitly empty translation hides copy; only missing languages fall back.
    node.dataset.zh = typeof values?.zh === 'string' ? values.zh : textValue(values?.en);
    node.dataset.en = typeof values?.en === 'string' ? values.en : textValue(values?.zh);
  });
  const researchList = document.querySelector('[data-research-projects]');
  list(content.researchProjects).forEach(entry => {
    if (!researchList) return;
    const article = document.createElement('article');
    article.className = 'research-project';
    const copy = document.createElement('div');
    copy.className = 'project-copy';
    const top = document.createElement('div');
    top.className = 'project-top';
    top.append(translated('h3', entry.title), translated('span', entry.date, 'project-date'));
    copy.append(top, translated('p', entry.description));
    if (entry.result?.zh || entry.result?.en) {
      const result = document.createElement('div');
      result.className = 'project-result';
      result.append(translated('p', entry.result));
      copy.append(result);
    }
    if (list(entry.tags).length) copy.append(tagList(entry.tags));
    if (entry.details?.zh || entry.details?.en) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.append(translated('span', {zh:'实现与贡献',en:'Implementation & contribution'}));
      const paragraph = translated('p', entry.details);
      paragraph.style.whiteSpace = 'pre-line';
      details.append(summary, paragraph);
      copy.append(details);
    }
    list(entry.links).forEach(link => {
      if (safeUrl(link.url)) copy.append(externalLink(link.url, link.label, 'project-link'));
    });
    article.append(copy, projectMedia(entry.media, true));
    researchList.append(article);
  });
  const publications = document.querySelector('[data-publications]');
  list(content.publications).forEach(entry => {
    if (!publications) return;
    const row = document.createElement('div');
    row.className = 'publication';
    row.append(externalLink(entry.url, entry.title), translated('p', entry.description));
    publications.append(row);
  });
  const education = document.querySelector('[data-education]');
  list(content.education).forEach(entry => {
    if (!education) return;
    const row = document.createElement('article');
    row.append(translated('small', entry.date), translated('h4', entry.school), translated('p', entry.degree));
    education.append(row);
  });
  const experience = document.querySelector('[data-experience]');
  list(content.experience).forEach(entry => {
    if (!experience) return;
    const row = document.createElement('div');
    row.className = 'intern';
    const company = document.createElement('strong');
    company.textContent = textValue(entry.company);
    const date = document.createElement('span');
    date.textContent = textValue(entry.date);
    row.append(company, date, translated('p', entry.role));
    experience.append(row);
  });
  const skills = document.querySelector('[data-skills]');
  if (skills) skills.replaceChildren(...tagList(content.skills).childNodes);
  function parseTimelineDate(value) {
    if (typeof value !== 'string') return null;
    const text = value.normalize('NFKC').trim().replace(/\s*([./\-年月日])\s*/g,'$1');
    let parts;
    const chinese = /^(\d{4})年(?:(\d{1,2})月(?:(\d{1,2})日?)?)?$/.exec(text);
    const separated = /^(\d{4})(?:([./-])(\d{1,2})(?:\2(\d{1,2}))?)?$/.exec(text);
    if (chinese) parts = [chinese[1],chinese[2],chinese[3]].filter(value => value !== undefined);
    else if (separated) parts = [separated[1],separated[3],separated[4]].filter(value => value !== undefined);
    else return null;
    const [year,month,day] = parts.map(Number);
    if (year < 1 || (month !== undefined && (month < 1 || month > 12))) return null;
    const monthDays = [31,year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,31,30,31,30,31,31,30,31,30,31];
    if (day !== undefined && (day < 1 || day > monthDays[month - 1])) return null;
    const canonical = parts.map((part,index) => index ? String(Number(part)).padStart(2,'0') : part).join('-');
    // A year/month denotes its entire interval. Only reject a range if every possible end precedes its start.
    const firstMonth = month ?? 1;
    const lastMonth = month ?? 12;
    return {
      canonical,
      precision:parts.length,
      min:year * 10000 + firstMonth * 100 + (day ?? 1),
      max:year * 10000 + lastMonth * 100 + (day ?? monthDays[lastMonth - 1])
    };
  }
  function makeDate(value, endValue) {
    value = parseTimelineDate(value)?.canonical || '';
    endValue = parseTimelineDate(endValue)?.canonical || '';
    const valid = /^\d{4}(-\d{2}(-\d{2})?)?$/.test(value || '');
    const date = valid ? document.createElement('time') : translated('span', {zh:'日期待补充',en:'Date to add'});
    date.className = 'update-date';
    if (valid) {date.dateTime = value; date.textContent = value.replaceAll('-', '.');}
    if (valid && endValue && /^\d{4}(-\d{2}(-\d{2})?)?$/.test(endValue)) {
      const range = document.createElement('div');
      range.className = 'update-date date-range';
      const end = document.createElement('time');
      end.dateTime = endValue;
      end.textContent = '– ' + endValue.replaceAll('-', '.');
      range.append(date, end);
      return range;
    }
    return date;
  }
  function externalLink(url, label, className) {
    const link = translated('a', label, className);
    applyLink(link, url);
    link.target = '_blank';
    link.rel = 'noopener';
    return link;
  }
  const supportGrid = document.querySelector('[data-support]');
  (content.researchSupport || []).forEach(entry => {
    if (!supportGrid) return;
    const card = document.createElement('article');
    card.className = 'support-card';
    const title = document.createElement('h4');
    title.append(externalLink(entry.url, {zh:entry.name + ' ↗',en:entry.name + ' ↗'}));
    card.append(title, translated('p', entry.description));
    supportGrid.append(card);
  });
  const computeGrid = document.querySelector('[data-computing]');
  (content.computingResources || []).forEach(entry => {
    if (!computeGrid) return;
    const card = document.createElement('article');
    card.className = 'compute-card';
    const provider = document.createElement('p');
    provider.className = 'resource-provider';
    provider.textContent = entry.provider;
    const title = document.createElement('h4');
    title.textContent = entry.name;
    const hardware = typeof entry.hardware === 'string' ? {zh:entry.hardware,en:entry.hardware} : entry.hardware;
    card.append(provider, title, translated('p', hardware, 'resource-hardware'), translated('p', entry.description, 'resource-description'), externalLink(entry.url, {zh:'官方规格 ↗',en:'Official specifications ↗'}, 'resource-source'));
    computeGrid.append(card);
  });
  const projectList = document.querySelector('[data-projects]');
  const projectLimit = Number(projectList?.dataset.limit) || Infinity;
  list(content.independentProjects).slice(0, projectLimit).forEach(entry => {
    if (!projectList) return;
    const article = document.createElement('article');
    article.className = 'independent-project';
    const copy = document.createElement('div');
    if (entry.category) {
      const category = document.createElement('span');
      category.className = 'eyebrow';
      category.textContent = entry.category;
      copy.append(category);
    }
    copy.append(translated('h3', entry.name));
    if (entry.description) copy.append(translated('p', entry.description));
    if (entry.tags?.length) {
      const tags = document.createElement('div');
      tags.className = 'tags';
      entry.tags.forEach(tag => {const label = document.createElement('span');label.textContent = tag;tags.append(label);});
      copy.append(tags);
    }
    if (entry.url) copy.append(externalLink(entry.url, entry.linkLabel || {zh:'查看源码 ↗',en:'View source ↗'}, 'project-link'));
    list(entry.links).forEach(link => {
      if (safeUrl(link.url)) copy.append(externalLink(link.url, link.label || {zh:'了解更多 ↗',en:'Learn more ↗'}, 'project-link'));
    });
    article.append(copy, projectMedia(entry.media));
    projectList.append(article);
  });
  function reservePhotoSpace(figure, config) {
    const width = Number(config?.width);
    const height = Number(config?.height);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) figure.style.aspectRatio = width + ' / ' + height;
  }
  function imageElement(config) {
    const image = document.createElement('img');
    const width = Number(config?.width);
    const height = Number(config?.height);
    if (Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0) {
      image.width = width;
      image.height = height;
    }
    image.dataset.zhAlt = config.alt?.zh || '';
    image.dataset.enAlt = config.alt?.en || config.alt?.zh || '';
    image.loading = 'lazy';
    return image;
  }
  const datasets = {
    academic: Array.isArray(content.academicActivities) ? content.academicActivities : [],
    life: Array.isArray(content.lifeUpdates) ? content.lifeUpdates : []
  };
  document.querySelectorAll('[data-timeline]').forEach(timeline => {
    const kind = timeline.dataset.timeline;
    const limit = Number(timeline.dataset.limit) || Infinity;
    const entries = (datasets[kind] || []).slice(0, limit);
    entries.forEach(entry => {
      const row = document.createElement('article');
      row.className = 'timeline-entry';
      const body = document.createElement('div');
      body.className = 'timeline-content';
      const text = document.createElement('p');
      text.className = 'update-text';
      text.append(translated('span', entry.text || {}));
      if (entry.example) text.append(translated('span', {zh:'示例',en:'Example'}, 'update-example'));
      body.append(text);
      if (entry.link?.url) body.append(externalLink(entry.link.url, entry.link.label || {zh:'了解更多 ↗',en:'Learn more ↗'}, 'timeline-link'));
      if (kind === 'life' && safeUrl(entry.photo?.src, true)) {
        const figure = document.createElement('figure');
        figure.className = 'timeline-photo';
        reservePhotoSpace(figure, entry.photo);
        const image = imageElement(entry.photo);
        image.addEventListener('error', () => figure.remove());
        figure.append(image);
        body.append(figure);
        image.src = safeUrl(entry.photo.src, true);
      }
      row.append(makeDate(entry.date, entry.endDate), body);
      timeline.append(row);
    });
    if (!entries.length) timeline.append(translated('p', {zh:'新的记录将在这里更新。',en:'New entries will appear here.'}, 'section-intro'));
    const note = document.querySelector('[data-timeline-note="' + kind + '"]');
    if (note) note.hidden = !entries.some(entry => entry.example);
  });
  document.querySelectorAll('[data-media]').forEach(slot => {
    const config = content.images?.[slot.dataset.media];
    if (!safeUrl(config?.src, true)) return;
    const image = imageElement(config);
    image.style.objectFit = config.fit === 'cover' ? 'cover' : 'contain';
    image.loading = slot.dataset.media === 'portrait' ? 'eager' : 'lazy';
    image.addEventListener('load', () => slot.classList.add('is-loaded'));
    image.addEventListener('error', () => {slot.classList.remove('is-loaded'); image.remove();});
    slot.append(image);
    image.src = safeUrl(config.src, true);
  });
  function renderLanguage() {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-zh][data-en]').forEach(node => {node.textContent = node.dataset[language];});
    document.querySelectorAll('img[data-zh-alt]').forEach(img => {img.alt = language === 'zh' ? img.dataset.zhAlt : img.dataset.enAlt;});
    if (languageButton) {
      languageButton.textContent = language === 'zh' ? 'EN' : '中文';
      languageButton.setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换到中文');
    }
    document.querySelectorAll('nav').forEach(nav => nav.setAttribute('aria-label', language === 'zh' ? '主导航' : 'Main navigation'));
    const name = textValue(profile.name);
    const page = document.documentElement.dataset.page;
    const pageTitles = {
      academic: {key:'academicTitle', zh:'学术活动', en:'Academic Activities'},
      projects: {key:'buildsTitle', zh:'个人作品', en:'Independent Projects'},
      life: {key:'lifeTitle', zh:'生活与近况', en:'Life & Updates'}
    };
    const pageTitle = pageTitles[page];
    document.title = pageTitle
      ? (textValue(content.pageText?.[pageTitle.key]?.[language]) || pageTitle[language]) + ' — ' + name
      : name + (language === 'zh' ? ' — 研究、作品与生活' : ' — Research, projects & life');
    const pageDescriptionKey = {academic:'academicPageDescription',projects:'projectsPageDescription',life:'lifePageDescription'}[page];
    const pageDescription = pageDescriptionKey ? content.pageText?.[pageDescriptionKey] : content.intro?.description;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = name + ' — ' + textValue(pageDescription?.[language]);
    document.querySelectorAll('.projects-page .archive-records').forEach(node => node.setAttribute('aria-label', language === 'zh' ? '个人作品' : 'Projects'));
    document.querySelectorAll('.life-page .archive-records').forEach(node => node.setAttribute('aria-label', language === 'zh' ? '生活记录' : 'Life updates'));
  }
  languageButton?.addEventListener('click', () => {
    language = language === 'zh' ? 'en' : 'zh';
    try {if (standalonePage) localStorage.setItem(languagePreferenceKey, language);} catch (_) {}
    renderLanguage();
  });
  renderLanguage();
})();
