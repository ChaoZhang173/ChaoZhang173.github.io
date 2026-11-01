(() => {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const websiteData = clone(window.SITE_CONTENT || {});
  let data = clone(websiteData);
  let assets = {};
  let active = 'profile';
  let dirty = false;
  let busy = false;
  let savedDraft = null;
  let fieldNumber = 0;
  let previewRequest = 0;
  let previewPage = 'index.html';
  let confirmationResolve = null;
  const openRecords = new WeakMap();
  const $ = selector => document.querySelector(selector);
  const contentRoot = $('#section-content');
  const message = $('#message');
  const status = $('#save-status');
  const nav = $('#section-nav');
  const confirmationDialog = $('#confirmation-dialog');
  async function confirmAction(text) {
    if (confirmationResolve) return false;
    $('#confirmation-text').textContent = text;
    return new Promise(resolve => {
      confirmationResolve = resolve;
      confirmationDialog.showModal();
      $('#confirmation-cancel').focus();
    });
  }
  function finishConfirmation(accepted) {
    const resolve = confirmationResolve;
    if (!resolve) return;
    confirmationResolve = null;
    if (confirmationDialog.open) confirmationDialog.close();
    resolve(accepted);
  }
  $('#confirmation-cancel').addEventListener('click',() => finishConfirmation(false));
  $('#confirmation-accept').addEventListener('click',() => finishConfirmation(true));
  confirmationDialog.addEventListener('cancel',event => {event.preventDefault();finishConfirmation(false);});
  confirmationDialog.addEventListener('close',() => {if (!confirmationDialog.open) finishConfirmation(false);});
  const sections = [
    {key:'profile', label:'个人资料', description:'填写姓名、身份、联系信息，选择个人照片和简历。'},
    {key:'intro', label:'首页简介', description:'用几句话介绍你关注的领域，以及你希望带来的价值。'},
    {key:'pageText', label:'栏目标题与说明', description:'修改网站的栏目名称、介绍文字与提示。中英文分别填写，导航名称会随对应栏目标题一起更新。'},
    {key:'researchProjects', label:'研究与工作', description:'整理研究与工作项目。每项都可以添加图片、结果、技术标签和相关链接。'},
    {key:'publications', label:'论文与专利', description:'添加论文、专利及其他公开成果的标题、说明与链接。'},
    {key:'researchSupport', label:'研究支持', description:'记录对研究、合作与学术交流提供支持的机构。'},
    {key:'computingResources', label:'计算资源', description:'介绍你使用的计算平台及硬件。公开平台配置与个人实际分配可以在说明中区分。'},
    {key:'academicActivities', label:'学术活动', description:'记录会议、报告与海报展示。日期可以只填年份，也可以填写完整起止日期。'},
    {key:'independentProjects', label:'个人作品', description:'展示游戏、应用与独立作品。暂时只填写名称和图片也可以。'},
    {key:'lifeUpdates', label:'生活与近况', description:'写下最近在做的事情、旅行与生活片刻，也可以为每条记录配上一张照片。'},
    {key:'education', label:'教育经历', description:'填写学校、学位与就读或毕业时间。'},
    {key:'experience', label:'工作经历', description:'填写公司、任职时间和工作内容。'},
    {key:'skills', label:'技能', description:'每行填写一项技能，网站会显示为单独的标签。'}
  ];
  const bilingualEmpty = () => ({zh:'', en:''});
  const el = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  function ensureStructure() {
    data.images ||= {};
    data.images.portrait ||= {src:'', alt:bilingualEmpty(), fit:'cover'};
    data.profile ||= {};
    data.intro ||= {};
    const memorialDefaults = websiteData.memorial || {enabled:false,title:bilingualEmpty(),text:bilingualEmpty(),image:{src:'',alt:bilingualEmpty()}};
    if (!data.memorial || typeof data.memorial !== 'object' || Array.isArray(data.memorial)) data.memorial = clone(memorialDefaults);
    if (typeof data.memorial.enabled !== 'boolean') data.memorial.enabled = memorialDefaults.enabled ?? false;
    ['title','text'].forEach(key => {
      if (!data.memorial[key] || typeof data.memorial[key] !== 'object' || Array.isArray(data.memorial[key])) data.memorial[key] = clone(memorialDefaults[key] || bilingualEmpty());
      ['zh','en'].forEach(language => {
        if (data.memorial[key][language] === undefined) data.memorial[key][language] = memorialDefaults[key]?.[language] ?? '';
      });
    });
    if (!data.memorial.image || typeof data.memorial.image !== 'object' || Array.isArray(data.memorial.image)) data.memorial.image = clone(memorialDefaults.image || {src:'',alt:bilingualEmpty()});
    if (data.memorial.image.src === undefined) data.memorial.image.src = memorialDefaults.image?.src ?? '';
    if (!data.memorial.image.alt || typeof data.memorial.image.alt !== 'object' || Array.isArray(data.memorial.image.alt)) data.memorial.image.alt = clone(memorialDefaults.image?.alt || bilingualEmpty());
    ['zh','en'].forEach(language => {
      if (data.memorial.image.alt[language] === undefined) data.memorial.image.alt[language] = memorialDefaults.image?.alt?.[language] ?? '';
    });
    if (!data.pageText || typeof data.pageText !== 'object' || Array.isArray(data.pageText)) data.pageText = {};
    // Older drafts do not have page copy; inherit missing defaults without replacing edits or deliberate blanks.
    Object.entries(websiteData.pageText || {}).forEach(([key,fallback]) => {
      if (data.pageText[key] === undefined) data.pageText[key] = clone(fallback);
      else if (fallback && typeof fallback === 'object' && data.pageText[key] && typeof data.pageText[key] === 'object') {
        ['zh','en'].forEach(language => {
          if (data.pageText[key][language] === undefined) data.pageText[key][language] = fallback[language] ?? '';
        });
      }
    });
    if (!['en','zh'].includes(data.defaultLanguage)) data.defaultLanguage = websiteData.defaultLanguage === 'zh' ? 'zh' : 'en';
    sections.filter(section => !['profile','intro','pageText'].includes(section.key)).forEach(section => {
      if (!Array.isArray(data[section.key])) data[section.key] = [];
    });
    normalizeTimelineDates();
  }
  function showMessage(text, kind = 'success') {
    message.textContent = text;
    message.dataset.kind = kind;
    message.hidden = false;
  }
  function setStatus(text, state = 'ready') {
    status.textContent = text;
    status.dataset.state = state;
  }
  function changed() {
    dirty = true;
    setStatus('有未保存的修改 · 仅在当前编辑页面中', 'dirty');
  }
  function setBusy(value) {
    busy = value;
    document.querySelectorAll('.header-actions button, .sidebar-tools button, #restore-button, #dismiss-draft-button, [data-preview-page]').forEach(button => {button.disabled = value;});
  }
  async function action(label, task, {dates = false} = {}) {
    if (busy) return;
    if (!window.EditorIO) {showMessage('编辑器功能文件未能载入。请重新解压完整网站文件，然后打开 editor.html。', 'error');return;}
    if (dates) {
      const error = checkDates();
      if (error) {showMessage(error, 'error');return;}
    }
    setBusy(true);
    message.hidden = true;
    try {await task();}
    catch (error) {
      showMessage(`${label}未完成：${error?.message || '发生了未知错误，请重试。'}`, 'error');
      if ($('#preview-dialog').open) $('#preview-status').textContent = `${label}未完成：${error?.message || '请重试。'}`;
      if (label === '保存草稿') setStatus('草稿未保存成功 · 当前修改仍保留在编辑页面中', 'error');
    } finally {setBusy(false);}
  }
  function field(parent, label, value, update, options = {}) {
    const wrap = el('label', 'field');
    const labelNode = el('span', 'field-label', label);
    const input = el(options.multiline ? 'textarea' : 'input');
    input.id = `editor-field-${++fieldNumber}`;
    if (!options.multiline) input.type = options.type || 'text';
    input.value = value ?? '';
    input.autocomplete = 'off';
    input.spellcheck = options.spellcheck !== false;
    if (options.placeholder) input.placeholder = options.placeholder;
    if (options.rows) input.rows = options.rows;
    if (options.inputMode) input.inputMode = options.inputMode;
    wrap.append(labelNode, input);
    if (options.help) wrap.append(el('span', 'field-help', options.help));
    if (options.date) {
      const error = el('span', 'field-error');
      error.hidden = true;
      wrap.append(error);
      input.addEventListener('blur', () => {
        const parsed = parseTimelineDate(input.value);
        const invalid = Boolean(input.value.trim()) && !parsed;
        if (!invalid) {
          input.value = parsed?.canonical || '';
          update(input.value);
        }
        input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
        error.textContent = '请填写真实有效的日期，例如 2026、2026-9、2026-9-2、2026/9/2、2026.9.2 或 2026年9月2日。';
        error.hidden = !invalid;
      });
      input.addEventListener('input', () => {
        // Do not interrupt partially typed dates or keep an old error while the user corrects it.
        input.setAttribute('aria-invalid','false');
        error.hidden = true;
      });
    }
    input.addEventListener('input', () => {
      // Keep the model canonical even when Save/Export is invoked without a blur event.
      update(options.date ? normalizeDateValue(input.value) : input.value);
      changed();
    });
    parent.append(wrap);
    return input;
  }
  function bilingual(parent, label, object, key, options = {}) {
    const current = typeof object[key] === 'string' ? {zh:object[key],en:object[key]} : object[key] || bilingualEmpty();
    const group = el('fieldset', 'bilingual');
    group.append(el('legend', '', label));
    const columns = el('div', 'fields-grid');
    ['zh','en'].forEach(language => {
      field(columns, language === 'zh' ? '中文内容' : '英文内容', current[language] || '', value => {
        if (!object[key] || typeof object[key] !== 'object') object[key] = {...current};
        object[key][language] = value;
        options.onChange?.();
      }, {...options, multiline:options.multiline !== false});
    });
    group.append(columns);
    parent.append(group);
  }
  function lines(parent, label, object, key, help = '每行一项。') {
    field(parent, label, Array.isArray(object[key]) ? object[key].join('\n') : '', value => {
      object[key] = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    }, {multiline:true, rows:4,help});
  }
  function simple(parent, label, object, key, options) {
    return field(parent, label, object[key], value => {object[key] = value;}, options);
  }
  function panel(title, note) {
    const node = el('section', 'form-panel');
    node.append(el('h3','panel-title',title));
    if (note) node.append(el('p','panel-note',note));
    contentRoot.append(node);
    return node;
  }
  function filePicker(label, accept, handler) {
    const button = el('label', 'file-button', label);
    const input = el('input');
    input.type = 'file';
    input.accept = accept;
    input.setAttribute('aria-label', label);
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      await action('读取文件', () => handler(file));
      input.value = '';
    });
    button.append(input);
    return button;
  }
  function imagePathForRecord(record, prefix) {
    if (!record.media) {
      let key;
      do {key = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;} while (data.images[key]);
      record.media = key;
    }
    data.images[record.media] ||= {src:'',alt:bilingualEmpty(),fit:'contain'};
    return data.images[record.media];
  }
  function imageEditor(parent, title, config, isPhoto = false) {
    const block = el('section', 'media-editor');
    const thumbnail = el('div', 'media-thumbnail');
    if (config.src) {
      const image = el('img');
      image.alt = config.alt?.zh || '所选图片预览';
      image.src = window.EditorIO?.assetURL(config.src,assets) || config.src;
      image.addEventListener('error', () => {thumbnail.textContent = '暂时无法预览';});
      thumbnail.append(image);
    } else thumbnail.append(el('span','','尚未添加图片'));
    const controls = el('div','media-controls');
    controls.append(el('h4','',title),el('p','','支持 JPG、PNG、WebP 和 GIF，每个文件不超过 25 MB。文件留在本地，导出时自动加入网站。'));
    const actions = el('div','file-actions');
    actions.append(filePicker(config.src ? '更换图片' : '选择图片', '.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif', async file => {
      if (!/\.(jpe?g|png|webp|gif)$/i.test(file.name) && !/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) throw new Error('请选择 JPG、PNG、WebP 或 GIF 图片。');
      const result = await EditorIO.readAsset(file, config.src || undefined);
      assets[result.path] = result.asset;
      config.src = result.path;
      delete config.width;delete config.height;
      if (Number.isSafeInteger(result.width) && result.width > 0 && Number.isSafeInteger(result.height) && result.height > 0) {
        config.width = result.width;config.height = result.height;
      }
      config.alt ||= bilingualEmpty();
      config.fit ||= 'contain';
      changed();
      renderContent();
    }));
    if (config.src) {
      const remove = el('button','text-button','移除图片');
      remove.type = 'button';
      remove.addEventListener('click', async () => {
        if (!await confirmAction('移除这张图片？图片位置会保留，可以重新选择。')) return;
        config.src = '';
        delete config.width;delete config.height;
        changed();
        renderContent();
      });
      actions.append(remove);
    }
    controls.append(actions);
    if (!isPhoto) {
      const label = el('label','field');
      label.append(el('span','field-label','显示方式'));
      const select = el('select');
      [['contain','完整显示，保持比例'],['cover','填满相框，保持比例并裁剪']].forEach(([value,text]) => {
        const option = el('option','',text);option.value = value;select.append(option);
      });
      select.value = config.fit === 'cover' ? 'cover' : 'contain';
      select.addEventListener('change', () => {config.fit = select.value;changed();});
      label.append(select);controls.append(label);
    }
    block.append(thumbnail,controls);
    const alt = el('div','media-alt');
    bilingual(alt,'图片说明（也供屏幕阅读器使用）',config,'alt',{multiline:false});
    block.append(alt);
    parent.append(block);
  }
  function resumeEditor(parent) {
    const block = el('section','resume-box');
    block.append(el('h4','','简历 PDF'),el('p','',data.profile.resume ? `当前文件：${data.profile.resume.split('/').pop()}` : '尚未选择简历。'),el('p','','请选择不超过 25 MB 的 PDF 文件。'));
    const actions = el('div','file-actions');
    actions.append(filePicker('选择简历 PDF','.pdf,application/pdf',async file => {
      if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') throw new Error('请选择 PDF 格式的简历。');
      const result = await EditorIO.readAsset(file,data.profile.resume || undefined);
      assets[result.path] = result.asset;
      data.profile.resume = result.path;
      changed();renderContent();
    }));
    block.append(actions);parent.append(block);
  }
  function renderProfile() {
    const basic = panel('个人信息');
    imageEditor(basic,'个人照片',data.images.portrait);
    const grid = el('div','fields-grid');
    [['展示姓名','name'],['中文姓名','chineseName'],['学校 / 机构','university'],['身份 / 职位','position'],['所在地','location'],['电子邮箱','email']].forEach(([label,key]) => simple(grid,label,data.profile,key,{type:key === 'email' ? 'email' : 'text'}));
    basic.append(grid);
    lines(basic,'关注领域',data.profile,'focus','每行一个领域，按填写顺序显示。');
    bilingual(basic,'职业方向',data.profile,'career',{multiline:false});
    const contact = panel('联系链接与简历');
    simple(contact,'GitHub 链接',data.profile,'github',{placeholder:'https://github.com/…',spellcheck:false});
    simple(contact,'LinkedIn 链接',data.profile,'linkedin',{placeholder:'https://www.linkedin.com/in/…',spellcheck:false});
    resumeEditor(contact);
    const memorial = panel('纪念两只猫','显示在左侧个人资料下方。可以更换合成照片、修改文字，或暂时关闭显示。');
    const enabledLabel = el('label','checkbox-field');
    const enabledInput = el('input');enabledInput.type = 'checkbox';enabledInput.checked = data.memorial.enabled;
    enabledInput.addEventListener('change',() => {data.memorial.enabled = enabledInput.checked;changed();});
    enabledLabel.append(enabledInput,el('span','','在网站上显示纪念区域'));memorial.append(enabledLabel);
    bilingual(memorial,'纪念标题',data.memorial,'title',{multiline:false});
    bilingual(memorial,'纪念文字',data.memorial,'text');
    imageEditor(memorial,'两只猫的合成照片',data.memorial.image,true);
  }
  function renderIntro() {
    const settings = panel('网站语言');
    const languageLabel = el('label','field');
    languageLabel.append(el('span','field-label','默认显示语言'));
    const languageSelect = el('select');
    languageSelect.id = 'default-language';
    [['en','English（英文）'],['zh','中文']].forEach(([value,label]) => {
      const option = el('option','',label);option.value = value;languageSelect.append(option);
    });
    languageSelect.value = data.defaultLanguage;
    languageSelect.addEventListener('change',() => {data.defaultLanguage = languageSelect.value;changed();});
    languageLabel.append(languageSelect,el('span','field-help','首次访问和编辑器预览使用此语言；访客仍可手动切换中英文。'));
    settings.append(languageLabel);
    const body = panel('首页简介','中英文内容分别填写；切换网站语言后会显示对应版本。');
    bilingual(body,'首页标题',data.intro,'heading',{multiline:false});
    bilingual(body,'自我介绍',data.intro,'description');
    bilingual(body,'补充信息',data.intro,'subline',{multiline:false});
  }
  function renderPageText() {
    const groups = [
      ['关于我', [['aboutEyebrow','“关于我”上方小标题']]],
      ['研究与成果', [['workTitle','研究与工作 · 栏目标题'],['workNote','研究与工作 · 补充说明'],['publicationsTitle','论文与专利 · 栏目标题']]],
      ['研究支持与计算资源', [['resourcesTitle','资助与计算资源 · 总标题'],['resourcesNav','导航中的简称'],['supportTitle','研究支持 · 小标题'],['supportDescription','研究支持 · 介绍文字'],['computingTitle','计算资源 · 小标题'],['computingDescription','计算资源 · 介绍文字'],['resourcesNote','计算资源 · 补充说明']]],
      ['学术活动', [['academicTitle','学术活动 · 栏目标题'],['academicDescription','首页上的活动介绍'],['academicPageDescription','学术活动独立页面的介绍'],['academicLogTitle','活动记录 · 小标题']]],
      ['作品与生活', [['buildsTitle','个人作品 · 栏目标题'],['buildsDescription','个人作品 · 介绍文字'],['projectsPageDescription','个人作品独立页面的介绍'],['projectsMore','首页“查看全部作品”链接文字'],['lifeTitle','生活与近况 · 栏目标题'],['lifeDescription','生活与近况 · 介绍文字'],['lifePageDescription','生活与近况独立页面的介绍'],['lifeMore','首页“查看全部生活记录”链接文字']]],
      ['经历、技能与联系', [['aboutTitle','经历与技能 · 总标题'],['educationTitle','教育经历 · 小标题'],['experienceTitle','工作经历 · 小标题'],['skillsTitle','技能 · 小标题'],['contactTitle','联系方式 · 栏目标题'],['contactEyebrow','联系方式上方小标题']]]
    ];
    groups.forEach(([title,fields]) => {
      const body = panel(title);
      fields.forEach(([key,label]) => bilingual(body,label,data.pageText,key,{multiline:/Description|Note/.test(key)}));
    });
  }
  function recordName(record,key) {
    const raw = record.title || record.name || record.school || record.company || record.text;
    if (typeof raw === 'string') return raw || '未命名记录';
    return raw?.zh || raw?.en || (key === 'experience' ? '未命名经历' : '未命名记录');
  }
  function list(key, renderRecord, newRecord, noun) {
    const records = data[key];
    if (!records.length) contentRoot.append(el('p','empty-state',`这里还没有${noun}，可以从下面添加。`));
    records.forEach((record,index) => {
      const card = el('details','record');
      card.open = openRecords.has(record) ? openRecords.get(record) : records.length <= 2 || index === 0;
      openRecords.set(record,card.open);
      card.addEventListener('toggle',() => {openRecords.set(record,card.open);});
      const summary = el('summary');
      const label = el('span','record-summary-label');
      const title = el('span','record-title',recordName(record,key));
      label.append(el('span','record-number',String(index + 1).padStart(2,'0')),title);
      const actions = el('span','record-actions');
      [['上移',-1],['下移',1],['删除',0]].forEach(([text,direction]) => {
        const button = el('button',direction === 0 ? 'delete' : '',text);
        button.type = 'button';
        button.disabled = direction === -1 && index === 0 || direction === 1 && index === records.length - 1;
        button.setAttribute('aria-label',`${text}第 ${index + 1} 项：${recordName(record,key)}`);
        button.addEventListener('click',async event => {
          event.preventDefault();event.stopPropagation();
          if (direction === 0) {
            if (!await confirmAction(`删除“${recordName(record,key)}”？这条记录将从当前编辑内容中移除。`)) return;
            records.splice(index,1);
          } else [records[index],records[index + direction]] = [records[index + direction],records[index]];
          changed();renderNav();renderContent();
        });
        actions.append(button);
      });
      summary.append(label,actions);
      const body = el('div','record-body');
      renderRecord(body,record,() => {title.textContent = recordName(record,key);});
      card.append(summary,body);contentRoot.append(card);
    });
    const add = el('button','add-record',`＋ 添加${noun}`);
    add.type = 'button';
    add.addEventListener('click',() => {
      records.push(newRecord());changed();renderNav();renderContent();
      const cards = contentRoot.querySelectorAll('.record');
      const last = cards[cards.length - 1];
      if (last) {last.open = true;openRecords.set(records[records.length - 1],true);last.scrollIntoView({block:'start',behavior:'smooth'});last.querySelector('input,textarea')?.focus({preventScroll:true});}
    });
    contentRoot.append(add);
  }
  function projectLinks(parent,record) {
    parent.append(el('h4','nested-heading','相关链接'));
    const links = Array.isArray(record.links) ? record.links : [];
    links.forEach((link,index) => {
      const row = el('div','nested-record');
      bilingual(row,'链接名称',link,'label',{multiline:false});
      simple(row,'网址',link,'url',{placeholder:'https://…',spellcheck:false});
      const actions = el('div','nested-actions');
      [['上移',-1],['下移',1],['删除链接',0]].forEach(([label,direction]) => {
        const button = el('button','',label);button.type = 'button';
        button.disabled = direction === -1 && index === 0 || direction === 1 && index === links.length - 1;
        button.addEventListener('click',async () => {
          if (!direction) {if (!await confirmAction('删除这个链接？')) return;links.splice(index,1);}
          else [links[index],links[index + direction]] = [links[index + direction],links[index]];
          changed();renderContent();
        });actions.append(button);
      });
      row.append(actions);parent.append(row);
    });
    const add = el('button','nested-add','＋ 添加相关链接');add.type = 'button';
    add.addEventListener('click',() => {record.links ||= [];record.links.push({label:bilingualEmpty(),url:''});changed();renderContent();});
    parent.append(add);
  }
  function renderResearch(parent,record,onChange) {
    bilingual(parent,'项目名称',record,'title',{multiline:false,onChange});
    bilingual(parent,'项目时间',record,'date',{multiline:false,placeholder:'例如：2025 — 至今'});
    imageEditor(parent,'项目图片',imagePathForRecord(record,'research'));
    bilingual(parent,'项目介绍',record,'description');
    bilingual(parent,'成果 / 结果',record,'result');
    lines(parent,'技术标签',record,'tags');
    bilingual(parent,'实现与贡献（展开后显示）',record,'details');
    projectLinks(parent,record);
  }
  function renderIndependent(parent,record,onChange) {
    bilingual(parent,'作品名称',record,'name',{multiline:false,onChange});
    imageEditor(parent,'作品图片',imagePathForRecord(record,'project'));
    simple(parent,'类别（可不填）',record,'category',{placeholder:'例如：软件 / 游戏 / 开源项目'});
    bilingual(parent,'作品介绍（可不填）',record,'description');
    lines(parent,'技术标签（可不填）',record,'tags');
    simple(parent,'作品 / 源码网址（可不填）',record,'url',{placeholder:'https://…',spellcheck:false});
    bilingual(parent,'链接名称（可不填）',record,'linkLabel',{multiline:false});
    projectLinks(parent,record);
  }
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
  function normalizeDateValue(value) {
    return parseTimelineDate(value)?.canonical ?? (typeof value === 'string' ? value.trim() : value);
  }
  function normalizeTimelineDates() {
    for (const key of ['academicActivities','lifeUpdates']) {
      for (const record of data[key] || []) {
        for (const dateKey of ['date','endDate']) {
          if (typeof record[dateKey] === 'string') record[dateKey] = normalizeDateValue(record[dateKey]);
        }
      }
    }
  }
  function validDate(value) {
    return Boolean(parseTimelineDate(value));
  }
  function checkDates() {
    normalizeTimelineDates();
    for (const key of ['academicActivities','lifeUpdates']) {
      for (const [index,record] of data[key].entries()) {
        const label = key === 'academicActivities' ? '学术活动' : '生活与近况';
        const start = parseTimelineDate(record.date);
        const end = parseTimelineDate(record.endDate);
        if (record.date && !start || record.endDate && !end) return `${label}第 ${index + 1} 条的日期无效。可以填写 2026、2026-9、2026-9-2、2026/9/2、2026.9.2 或 2026年9月2日，请检查月份和天数。`;
        if (record.endDate && !record.date) return `${label}第 ${index + 1} 条填写了结束日期，请补充开始日期。`;
        if (start && end && end.max < start.min) return `${label}第 ${index + 1} 条的结束日期早于开始日期，请检查。`;
      }
    }
    return '';
  }
  function renderTimeline(parent,record,onChange,isLife) {
    const dates = el('div','fields-grid');
    const dateOptions = {placeholder:'例如 2026-9-2',help:'支持 2026、2026-9、2026-9-2、2026/9/2、2026.9.2、2026年9月2日；会自动补齐为标准格式。不知道日期时留空。',date:true,spellcheck:false};
    field(dates,'开始日期 / 事件日期',record.date,value => {record.date = value.trim();},dateOptions);
    field(dates,'结束日期（可不填）',record.endDate,value => {record.endDate = value.trim();},dateOptions);
    parent.append(dates);
    bilingual(parent,'内容',record,'text',{onChange});
    const checkbox = el('label','checkbox-field');
    const input = el('input');input.type = 'checkbox';input.checked = !!record.example;
    input.addEventListener('change',() => {record.example = input.checked;changed();});
    checkbox.append(input,el('span','','标注为示例（网站上会显示“示例”）'));parent.append(checkbox);
    if (isLife) {
      record.photo ||= {src:'',alt:bilingualEmpty()};
      imageEditor(parent,'这条记录的照片',record.photo,true);
    }
    const link = record.link || {url:'',label:bilingualEmpty()};
    field(parent,'相关网址（可不填）',link.url,value => {record.link ||= link;record.link.url = value;},{placeholder:'https://…',spellcheck:false});
    const linkProxy = {};
    Object.defineProperty(linkProxy,'label',{get:() => link.label,set:value => {record.link ||= link;record.link.label = value;}});
    bilingual(parent,'链接名称（可不填）',linkProxy,'label',{multiline:false,onChange:() => {record.link ||= link;}});
  }
  function renderContent() {
    ensureStructure();
    contentRoot.replaceChildren();
    const section = sections.find(item => item.key === active);
    $('#section-title').textContent = section.label;
    $('#section-description').textContent = section.description;
    $('#section-eyebrow').textContent = `你的主页 / ${String(sections.indexOf(section)+1).padStart(2,'0')}`;
    if (active === 'profile') renderProfile();
    if (active === 'intro') renderIntro();
    if (active === 'pageText') renderPageText();
    if (active === 'researchProjects') list(active,renderResearch,() => ({title:bilingualEmpty(),date:bilingualEmpty(),description:bilingualEmpty(),tags:[],links:[]}), '研究项目');
    if (active === 'independentProjects') list(active,renderIndependent,() => ({name:bilingualEmpty()}),'个人作品');
    if (active === 'publications') list(active,(parent,record,onChange) => {
      bilingual(parent,'成果标题',record,'title',{multiline:false,onChange});bilingual(parent,'成果说明',record,'description');simple(parent,'网址',record,'url',{placeholder:'https://…',spellcheck:false});
    },() => ({title:bilingualEmpty(),description:bilingualEmpty(),url:''}),'论文 / 专利');
    if (active === 'researchSupport') list(active,(parent,record,onChange) => {
      field(parent,'机构名称 / 缩写',record.name,value => {record.name = value;onChange();});bilingual(parent,'机构介绍',record,'description');simple(parent,'机构网址',record,'url',{placeholder:'https://…',spellcheck:false});
    },() => ({name:'',description:bilingualEmpty(),url:''}),'支持机构');
    if (active === 'computingResources') list(active,(parent,record,onChange) => {
      field(parent,'平台名称',record.name,value => {record.name = value;onChange();});simple(parent,'所属机构 / 提供方',record,'provider');bilingual(parent,'硬件摘要',record,'hardware',{multiline:false});bilingual(parent,'平台说明',record,'description');simple(parent,'官方资料网址',record,'url',{placeholder:'https://…',spellcheck:false});
    },() => ({name:'',provider:'',hardware:bilingualEmpty(),description:bilingualEmpty(),url:''}),'计算资源');
    if (['academicActivities','lifeUpdates'].includes(active)) list(active,(parent,record,onChange) => renderTimeline(parent,record,onChange,active === 'lifeUpdates'),() => ({date:'',text:bilingualEmpty(),example:false}),active === 'lifeUpdates' ? '生活记录' : '学术活动');
    if (active === 'education') list(active,(parent,record,onChange) => {
      bilingual(parent,'学校',record,'school',{multiline:false,onChange});bilingual(parent,'时间',record,'date',{multiline:false});bilingual(parent,'学位 / 专业',record,'degree',{multiline:false});
    },() => ({school:bilingualEmpty(),date:bilingualEmpty(),degree:bilingualEmpty()}),'教育经历');
    if (active === 'experience') list(active,(parent,record,onChange) => {
      field(parent,'公司 / 机构',record.company,value => {record.company = value;onChange();});simple(parent,'任职时间',record,'date',{placeholder:'例如：2025.05 — 2025.08'});bilingual(parent,'职位与工作内容',record,'role');
    },() => ({company:'',date:'',role:bilingualEmpty()}),'工作经历');
    if (active === 'skills') lines(panel('技能标签'),'技能',data,'skills');
  }
  function renderNav() {
    nav.replaceChildren();
    sections.forEach(section => {
      const button = el('button','nav-button');button.type = 'button';
      button.append(el('span','',section.label));
      if (Array.isArray(data[section.key])) button.append(el('span','nav-count',String(data[section.key].length)));
      if (section.key === active) button.setAttribute('aria-current','page');
      button.addEventListener('click',() => {active = section.key;renderNav();renderContent();$('#editor-main').focus({preventScroll:true});});
      nav.append(button);
    });
  }
  function applyState(state,label) {
    if (!state?.data || typeof state.data !== 'object' || Array.isArray(state.data)) throw new Error('草稿中没有可读取的网站内容。');
    data = clone(state.data);
    assets = clone(state.assets || {});
    ensureStructure();
    $('#source-badge').textContent = label;
    renderNav();renderContent();
  }
  function newPreviewFrame() {
    const frame = el('iframe');
    frame.id = 'preview-frame';
    frame.title = '个人主页预览';
    frame.setAttribute('sandbox','allow-scripts');
    return frame;
  }
  function discardPreview() {
    ++previewRequest;
    // Discard the previous browsing context, including scripts, when the modal closes.
    $('#preview-frame').replaceWith(newPreviewFrame());
  }
  async function updatePreview(target = previewPage) {
    const request = ++previewRequest;
    $('#preview-status').textContent = '正在准备当前内容的预览…';
    const html = await EditorIO.preview(clone(data),clone(assets),target);
    if (request !== previewRequest || !$('#preview-dialog').open) return;
    // A fresh iframe in the visible dialog avoids reusing a suspended/blank srcdoc context.
    const frame = newPreviewFrame();
    frame.addEventListener('load',() => {
      if (request === previewRequest && $('#preview-dialog').open && frame === $('#preview-frame')) {
        $('#preview-status').textContent = '预览当前编辑内容；外部链接可能在预览中不可用。';
      }
    },{once:true});
    frame.srcdoc = html;
    $('#preview-frame').replaceWith(frame);
    previewPage = target.split('#')[0];
    document.querySelectorAll('[data-preview-page]').forEach(button => {button.setAttribute('aria-pressed',String(button.dataset.previewPage === previewPage));});
  }
  $('#save-button').addEventListener('click',() => action('保存草稿',async () => {
    const snapshot = clone(data);
    const assetSnapshot = clone(assets);
    await EditorIO.saveDraft(snapshot,assetSnapshot);
    savedDraft = {data:snapshot,assets:assetSnapshot};
    const unchanged = JSON.stringify(data) === JSON.stringify(snapshot) && JSON.stringify(assets) === JSON.stringify(assetSnapshot);
    dirty = !unchanged;
    const time = new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit'}).format(new Date());
    setStatus(unchanged ? `草稿已保存到当前浏览器 · ${time} · 尚未更新网站` : '刚才的草稿已保存，仍有新的修改尚未保存', unchanged ? 'saved' : 'dirty');
    $('#source-badge').textContent = '浏览器草稿';
    $('#draft-banner').hidden = true;
    showMessage('草稿已保存。要更新网站，请下载网站 ZIP，再将文件上传到 GitHub。');
  }));
  $('#preview-button').addEventListener('click',() => action('预览网站',async () => {
    if (!$('#preview-dialog').open) $('#preview-dialog').showModal();
    await updatePreview();
  },{dates:true}));
  document.querySelectorAll('[data-preview-page]').forEach(button => button.addEventListener('click',() => action('切换预览',() => updatePreview(button.dataset.previewPage),{dates:true})));
  window.addEventListener('message',event => {
    if (event.source !== $('#preview-frame').contentWindow || !$('#preview-dialog').open) return;
    const navigation = event.data;
    if (navigation?.type !== 'chao-preview-navigation' || !['index.html','academic.html','projects.html','life.html'].includes(navigation.page)) return;
    const hash = typeof navigation.hash === 'string' && /^#[A-Za-z0-9_-]*$/.test(navigation.hash) ? navigation.hash : '';
    action('切换预览',() => updatePreview(navigation.page + hash),{dates:true});
  });
  $('#close-preview').addEventListener('click',() => {discardPreview();$('#preview-dialog').close();});
  $('#preview-dialog').addEventListener('cancel',() => discardPreview());
  $('#preview-dialog').addEventListener('close',() => {if (!$('#preview-dialog').open) discardPreview();});
  $('#preview-width').addEventListener('click',() => {
    const mobile = $('.preview-stage').classList.toggle('mobile');
    $('#preview-width').textContent = mobile ? '桌面宽度' : '手机宽度';
    $('#preview-width').setAttribute('aria-pressed',String(mobile));
  });
  $('#export-button').addEventListener('click',() => action('下载网站',async () => {
    const filename = await EditorIO.exportSite(clone(data),clone(assets));
    showMessage(`已开始下载网站 ZIP${filename ? `（${filename}）` : ''}，请在下载文件夹确认。文件包含当前文字、图片与简历；下载不会自动发布，也不会替你保存浏览器草稿。`);
  },{dates:true}));
  $('#backup-button').addEventListener('click',() => action('备份草稿',async () => {
    const filename = await EditorIO.downloadBackup(clone(data),clone(assets));showMessage(`已开始下载草稿备份${filename ? `（${filename}）` : ''}，请在下载文件夹确认。保留这份文件，之后可以导入继续编辑。`);
  }));
  $('#import-button').addEventListener('click',() => $('#backup-file').click());
  $('#backup-file').addEventListener('change',async event => {
    const file = event.target.files?.[0];if (!file) return;
    await action('导入备份',async () => {
      const state = await EditorIO.readBackup(file);
      if (!await confirmAction('导入备份会替换当前编辑内容。确认继续？')) return;
      applyState(state,'导入的备份');changed();$('#draft-banner').hidden = true;
      showMessage('备份已导入，尚未保存到当前浏览器。请检查内容，然后保存草稿。');
    });event.target.value = '';
  });
  $('#restore-button').addEventListener('click',async () => {
    if (!savedDraft || busy) return;
    if (dirty && !await confirmAction('恢复浏览器草稿会替换当前未保存的修改，继续吗？')) return;
    try {applyState(savedDraft,'浏览器草稿');dirty = false;setStatus('已恢复浏览器草稿 · 尚未更新网站','saved');$('#draft-banner').hidden = true;showMessage('现在编辑的是浏览器中保存的草稿。');}
    catch (error) {showMessage(`恢复草稿未完成：${error.message}`,'error');}
  });
  $('#dismiss-draft-button').addEventListener('click',() => {$('#draft-banner').hidden = true;showMessage('继续编辑网站文件中的内容。之前的草稿仍保留，下一次保存将替换它。');});
  $('#reset-button').addEventListener('click',async () => {
    if (!await confirmAction('将编辑器恢复为网站文件中的版本？当前编辑内容会被替换，浏览器已保存的草稿不会立即删除。')) return;
    applyState({data:websiteData,assets:{}},'网站版本');dirty = false;setStatus('已恢复网站文件版本 · 还未保存为浏览器草稿');showMessage('已恢复网站文件中的内容。如果想用这个版本替换浏览器草稿，请点击“保存草稿”。');
  });
  window.addEventListener('beforeunload',event => {if (dirty) {event.preventDefault();event.returnValue = '';}});
  ensureStructure();renderNav();renderContent();setStatus('正在编辑网站文件版本 · 还未保存为浏览器草稿');
  if (window.EditorIO) {
    EditorIO.loadDraft().then(draft => {
      if (draft) {
        savedDraft = draft;
        const savedAt = new Date(draft.savedAt || '');
        if (!Number.isNaN(savedAt.getTime())) $('#draft-banner strong').textContent = `发现浏览器草稿 · ${new Intl.DateTimeFormat('zh-CN',{dateStyle:'medium',timeStyle:'short'}).format(savedAt)}`;
        $('#draft-banner').hidden = false;
      }
    }).catch(error => {showMessage(`无法读取浏览器草稿：${error?.message || '请检查浏览器存储设置。'}。当前网站内容仍可编辑；也可以使用备份功能保留修改。`,'error');});
  } else showMessage('编辑器功能文件未能载入。请重新解压完整网站文件，然后打开 editor.html。','error');
})();
