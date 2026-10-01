(function () {
    var $ = function (s) { return document.querySelector(s) }, esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]+/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) };
    var lc = function (s) { return String(s || '').toLowerCase() }, list = function (s) { return s.split(',').map(function (x) { return x.trim() }).filter(Boolean) };

    var def = {
        sources: [{ id: 1, name: 'TopJobs', url: 'https://www.topjobs.lk', kind: 'Sri Lanka Board', on: true }, { id: 2, name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs', kind: 'Job Search', on: true }],
        profile: {
            roles: ['Cyber Security Analyst', 'SOC Analyst', 'Cybersecurity Intern', 'Information Security Analyst', 'Associate Software Engineer', 'Junior Software Engineer', 'Software Engineer Intern', 'Junior Web Developer', 'Full Stack Developer', 'React Developer', 'Python Developer', 'Junior Data Analyst', 'Data Analyst Intern', 'Network Security Engineer', 'IT Support Specialist'],
            skills: ['Python', 'React.js', 'JavaScript', 'TypeScript', 'Node.js', 'FastAPI', 'PHP', 'Cybersecurity', 'Network Defense', 'Intrusion Detection', 'Suricata', 'Wireshark', 'BurpSuite', 'PostgreSQL', 'MySQL', 'Linux', 'Bash', 'Git', 'Docker', 'Data Analytics', 'Pandas', 'NumPy', 'Machine Learning', 'Power BI', 'Java', 'C#', 'HTML', 'CSS', 'Express.js', 'GDPR'],
            education: ['Bachelor', 'BSc', 'Information Technology', 'Cyber Security', 'Computer Science', 'Software Engineering', 'Computing', 'Data Science', 'Undergraduate', 'University of Moratuwa', 'Victoria University', 'NSBM'],
            locations: ['Sri Lanka', 'Colombo', 'Western Province', 'Remote', 'Hybrid', 'Australia', 'UK', 'US', 'Singapore'],
            levels: ['Internship', 'Entry level', 'Graduate', 'Junior', 'Trainee', 'Associate', 'Undergraduate'],
            time: '07:00',
            min: 50
        },
        jobs: [],
        filt: {}
    };
    var S = def;
    try { var r = JSON.parse(localStorage.getItem('jobfinder-v1')); if (r && r.profile) S = r } catch (e) { }
    function normalizeProfile(value) {
        var p = value || {}, d = def.profile;
        return { roles: Array.isArray(p.roles) ? p.roles : d.roles, skills: Array.isArray(p.skills) ? p.skills : d.skills, education: Array.isArray(p.education) ? p.education : d.education, locations: Array.isArray(p.locations) ? p.locations : d.locations, levels: Array.isArray(p.levels) ? p.levels : d.levels, time: typeof p.time === 'string' ? p.time : d.time, min: typeof p.min === 'number' ? p.min : d.min };
    }
    if (S.profv !== 4) {
        S.profile = def.profile;
        S.profv = 4;
        save();
    }
    S.profile = normalizeProfile(S.profile);
    function save() { try { localStorage.setItem('jobfinder-v1', JSON.stringify(S)) } catch (e) { } }
    function syncScanner() {
        if (location.protocol === 'file:') return;
        fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scan_time: S.profile.time, sources: S.sources.filter(function (s) { return s.on }), profile: S.profile }) }).catch(function () { });
    }
    function loadServerJobs() {
        if (location.protocol === 'file:') return;
        fetch('/api/jobs').then(function (r) { return r.ok ? r.json() : [] }).then(function (a) {
            if (!Array.isArray(a)) return;
            var existing = {}; S.jobs.forEach(function (j) { existing[fp(j)] = j });
            a.forEach(function (j) {
                if (j && j.title && j.company) {
                    var key = fp(j);
                    if (!existing[key]) {
                        S.jobs.push(j); existing[key] = j;
                    } else {
                        if (!existing[key].location && j.location) existing[key].location = j.location;
                        if (!existing[key].type && j.type) existing[key].type = j.type;
                        if (!existing[key].level && j.level) existing[key].level = j.level;
                    }
                }
            });
            save(); render();
        }).catch(function () { });
    }
    function loadServerSettings() {
        if (location.protocol === 'file:') return;
        fetch('/api/settings').then(function (r) { return r.ok ? r.json() : null }).then(function (settings) {
            if (!settings || !Array.isArray(settings.sources) || !settings.profile) return;
            S.sources = settings.sources; S.profile = normalizeProfile(settings.profile); S.srcv = 2; save(); prof(); nextScan(); render();
        }).catch(function () { });
    }
    var CO = [
        "https://www.acsysnetworks.com/careers",
        "https://amplaz.com/careers/",
        "https://www.citadelsecurities.com/careers",
        "https://comunlabs.com/careers/",
        "https://cubenetworks.com.au/careers-at-cube/",
        "https://www.delivergate.com/about/careers",
        "https://deltaspike.io/support/#career",
        "https://www.ey.com/en_gl/careers",
        "https://www.fcodelabs.com/careers",
        "https://www.fidaglobal.com/support.html",
        "https://careers.fortude.co/",
        "https://gtngroup.com/global/careers/",
        "https://hutch.lk/careers/",
        "https://www.ifs.com/en/about/careers",
        "https://careers.innodata.com/",
        "https://its.lk/career.html",
        "https://www.kenresearch.com/careers/",
        "https://leveingroup.com/jobs/",
        "https://www.mongodb.com/company/careers",
        "https://blog.peopleshr.com/careers/",
        "https://riskonnect.com/en-gb/company/careers/",
        "https://www.se.com/ww/en/about-us/careers/",
        "https://unisongroup.com/career",
        "https://careers.vampiordesigns.com/",
        "https://www.virtusa.com/careers/",
        "https://www.vitalhub.lk/jobs",
        "https://www.weblankan.com/careers/",
        "https://www.wiasystems.com/careers"
    ];
    var BD = [];
    function nm(u) { try { var x = new URL(u), n = x.hostname.replace(/^www\d?\./, ''); return /linkedin/.test(n) ? n + x.pathname.replace(/\/$/, '') : n } catch (e) { return u } }
    var FLAG = /linkedin\.com|indeed\.com|seek\.com|joinhandshake|Account\/Login|nforce\.nsbm/i;
    if (S.srcv !== 2) {
        var have = {}; S.sources.forEach(function (s) { have[s.url.replace(/\/$/, '')] = 1 });
        [[CO, 'Company'], [BD, 'Recuitement Agency']].forEach(function (g, gi) { g[0].forEach(function (u, i) { var k = u.replace(/\/$/, ''); if (have[k]) return; have[k] = 1; var f = FLAG.test(u); S.sources.push({ id: Date.now() + gi * 1000 + i, name: nm(u), url: u, kind: g[1], on: !f, note: f ? 'Needs login or API' : '' }) }) }); S.srcv = 2; save()
    }
    var now = Date.now(), H = 36e5;
    S.jobs = (S.jobs || []).filter(function (j) { return !(j && j.sample); });
    if (S.jobs.length) { save(); }
    function fp(j) { return lc(j.company + '|' + j.title + '|' + j.location).replace(/\s+/g, ' ') }
    function score(j) {
        var p = S.profile, ps = p.skills.map(lc), hay = lc([j.title, j.description, (j.skills || []).join(' '), j.education].join(' '));
        var js = j.skills || [], hit = js.filter(function (s) { return ps.indexOf(lc(s)) > -1 }), miss = js.filter(function (s) { return ps.indexOf(lc(s)) < 0 });
        var all = ps.filter(function (s) { return hay.indexOf(s) > -1 });
        var skill = js.length ? hit.length / js.length : Math.min(1, all.length / 3);
        var t = lc(j.title), title = p.roles.some(function (r) { return t.indexOf(lc(r)) > -1 }) ? 1 : (p.roles.some(function (r) { var w = lc(r).split(' '); return w.filter(function (x) { return t.indexOf(x) > -1 }).length >= Math.ceil(w.length / 2) }) ? 0.5 : 0);
        var loc = p.locations.some(function (l) { return lc(j.location).indexOf(lc(l)) > -1 || (lc(l) === 'remote' && j.remote === 'remote') || (lc(l) === 'hybrid' && j.remote === 'hybrid') }) ? 1 : 0;
        var lv = lc(j.level + ' ' + j.title), exp = p.levels.some(function (l) { return lv.indexOf(lc(l)) > -1 }) ? 1 : 0;
        var edu = p.education.some(function (e) { return hay.indexOf(lc(e)) > -1 }) ? 1 : (j.education ? 0.3 : 0.6);
        var pref = Math.min(1, all.length / 5);
        var n = Math.round(40 * skill + 20 * edu + 15 * exp + 10 * loc + 10 * title + 5 * pref);
        return { n: n, hit: hit, miss: miss, why: { loc: loc, exp: exp, edu: edu >= 1, title: title } };
    }
    function inferJobLoc(j) {
        if (j.location) return j.location;
        var t = lc([j.title, j.company, j.description, j.source, (j.urls ? j.urls.join(' ') : j.url || '')].join(' '));
        if (t.indexOf('colombo') > -1) return 'Colombo';
        if (t.indexOf('kandy') > -1) return 'Kandy';
        if (t.indexOf('galle') > -1) return 'Galle';
        if (t.indexOf('western province') > -1) return 'Western Province';
        if (t.indexOf('.lk') > -1 || t.indexOf('sri lanka') > -1 || t.indexOf('top jobs') > -1 || t.indexOf('topjobs') > -1) return 'Sri Lanka';
        if (t.indexOf('.au') > -1 || t.indexOf('australia') > -1 || t.indexOf('sydney') > -1 || t.indexOf('melbourne') > -1) return 'Australia';
        if (t.indexOf('.uk') > -1 || t.indexOf('london') > -1 || t.indexOf('united kingdom') > -1) return 'United Kingdom';
        if (t.indexOf('.ae') > -1 || t.indexOf('dubai') > -1) return 'Dubai, UAE';
        if (t.indexOf('singapore') > -1) return 'Singapore';
        if (t.indexOf('united states') > -1 || t.indexOf('usa') > -1 || t.indexOf('.us/') > -1) return 'United States';
        if (t.indexOf('remote') > -1 || j.remote === 'remote') return 'Remote';
        return '';
    }
    function inferJobType(j) {
        if (j.type) return j.type;
        var h = lc([j.title, j.description].join(' '));
        if (/\b(internship|intern)\b/.test(h)) return 'Internship';
        if (/\b(part[\s-]?time)\b/.test(h)) return 'Part-time';
        if (/\b(contract|contractor|fixed[\s-]?term)\b/.test(h)) return 'Contract';
        if (/\b(freelance|freelancer)\b/.test(h)) return 'Freelance';
        if (/\b(full[\s-]?time|permanent)\b/.test(h)) return 'Full-time';
        return '';
    }
    function inferJobLevel(j) {
        if (j.level) return j.level;
        var h = lc([j.title, j.description].join(' '));
        if (/\b(internship|intern)\b/.test(h)) return 'Internship';
        if (/\b(lead|principal|head\s+of|director)\b/.test(h)) return 'Lead';
        if (/\b(manager|management)\b/.test(h)) return 'Manager';
        if (/\b(senior|sr\.?|experienced)\b/.test(h)) return 'Senior';
        if (/\b(mid[\s-]?level|intermediate)\b/.test(h)) return 'Mid level';
        if (/\b(junior|jr\.?)\b/.test(h)) return 'Junior';
        if (/\b(entry[\s-]?level|graduate|fresh|trainee)\b/.test(h)) return 'Entry level';
        return '';
    }
    function inferJobRemote(j) {
        if (j.remote && j.remote !== 'onsite') return j.remote;
        var h = lc([j.title, j.description, j.location, j.source, (j.urls ? j.urls.join(' ') : j.url || '')].join(' '));
        if (/\bhybrid\b/.test(h)) return 'hybrid';
        if (/\bremote\b/.test(h)) return 'remote';
        return j.remote || 'onsite';
    }
    function jobs() {
        var m = {}; S.jobs.forEach(function (j) {
            var k = fp(j), o = m[k]; if (!o) { m[k] = o = Object.assign({}, j, { srcs: [], urls: [] }); o.key = k }
            if (!o.location) o.location = inferJobLoc(o);
            if (!o.type) o.type = inferJobType(o);
            if (!o.level) o.level = inferJobLevel(o);
            o.remote = inferJobRemote(o);
            if (o.srcs.indexOf(j.source) < 0) { o.srcs.push(j.source); o.urls.push(j.url) } if (j.posted && j.posted < o.posted) o.posted = j.posted
        });
        return Object.keys(m).map(function (k) {
            var j = m[k];
            if (!j.location) j.location = inferJobLoc(j);
            if (!j.type) j.type = inferJobType(j);
            if (!j.level) j.level = inferJobLevel(j);
            j.remote = inferJobRemote(j);
            j.sc = score(j);
            return j;
        });
    }
    function ago(d) { var h = Math.round((Date.now() - new Date(d)) / H); return h < 1 ? 'just now' : h < 24 ? h + 'h ago' : Math.round(h / 24) + 'd ago' }
    function opts(sel, label, vals, cur) {
        var el = $(sel);
        if (!el) return;
        el.innerHTML = '<option value="">' + label + '</option>' + vals.map(function (v) {
            return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(v) + '</option>';
        }).join('');
        el.value = cur || '';
    }
    function uniq(a) { return a.filter(function (v, i) { return v && a.indexOf(v) === i }).sort() }
    var F = S.filt || {};
    function render() {
        var all = jobs();
        opts('#fs', 'All Sources', uniq(all.reduce(function (a, j) { return a.concat(j.srcs) }, [])), F.s);
        var defLocs = ['Sri Lanka', 'Colombo', 'Western Province', 'Kandy', 'Galle', 'Australia', 'United Kingdom', 'United States', 'Singapore', 'Dubai, UAE', 'Remote'];
        if (S.profile && Array.isArray(S.profile.locations)) {
            defLocs = S.profile.locations.filter(function (l) { return lc(l) !== 'hybrid' }).concat(defLocs);
        }
        opts('#fl', 'All Locations', uniq(all.map(function (j) { return j.location }).concat(defLocs)), F.l);
        var defTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'], defLevels = ['Internship', 'Entry level', 'Junior', 'Mid level', 'Senior', 'Lead', 'Manager'];
        opts('#ft', 'All Types', uniq(all.map(function (j) { return j.type }).concat(defTypes)), F.t);
        opts('#fe', 'All Levels', uniq(all.map(function (j) { return j.level }).concat(defLevels)), F.e);
        opts('#fst', 'All Work Modes', ['Remote', 'Hybrid'], F.st);
        $('#fm').value = F.m == null ? S.profile.min : F.m; $('#fmv').textContent = $('#fm').value; $('#q').value = F.q || ''; $('#so').value = F.o || 'score';
        var min = +$('#fm').value, q = lc(F.q);
        var out = all.filter(function (j) {
            if (j.sc.n < min) return false;
            if (q && lc([j.title, j.company, j.description, (j.skills || []).join(' ')].join(' ')).indexOf(q) < 0) return false;
            if (F.s && j.srcs.indexOf(F.s) < 0) return false;
            if (F.l) {
                var jl = lc(j.location || inferJobLoc(j)), fl = lc(F.l);
                var mLoc = (jl && (jl === fl || jl.indexOf(fl) > -1 || fl.indexOf(jl) > -1)) ||
                    (fl === 'remote' && (lc(j.remote) === 'remote' || jl.indexOf('remote') > -1)) ||
                    lc([j.title, j.company, j.description, j.source].join(' ')).indexOf(fl) > -1;
                if (!mLoc) return false;
            }
            if (F.t) {
                var jt = lc(j.type || inferJobType(j)), ft = lc(F.t);
                var mType = (jt && (jt === ft || jt.indexOf(ft) > -1 || ft.indexOf(jt) > -1)) ||
                    lc([j.title, j.description].join(' ')).indexOf(ft) > -1;
                if (!mType) return false;
            }
            if (F.e) {
                var je = lc(j.level || inferJobLevel(j)), fe = lc(F.e);
                var mLevel = (je && (je === fe || je.indexOf(fe) > -1 || fe.indexOf(je) > -1)) ||
                    lc([j.title, j.description].join(' ')).indexOf(fe) > -1;
                if (!mLevel) return false;
            }
            if (F.st) {
                var jrm = lc(j.remote || inferJobRemote(j)), fst = lc(F.st);
                var mMode = (jrm === fst) ||
                    (fst === 'remote' && (jrm === 'remote' || lc(j.location).indexOf('remote') > -1)) ||
                    (fst === 'hybrid' && (jrm === 'hybrid' || lc(j.location).indexOf('hybrid') > -1)) ||
                    lc([j.title, j.location, j.description].join(' ')).indexOf(fst) > -1;
                if (!mMode) return false;
            }
            return true;
        });
        var so = F.o || 'score';
        out.sort(function (a, b) { return so === 'date' ? new Date(b.posted) - new Date(a.posted) : so === 'company' ? a.company.localeCompare(b.company) : b.sc.n - a.sc.n });
        var day = all.filter(function (j) { return Date.now() - new Date(j.posted) < 24 * H }).length;
        $('#stats').innerHTML = [[all.length, 'Jobs Found'], [day, 'Posted in 24h'], [all.filter(function (j) { return j.sc.n >= S.profile.min }).length, 'Matching']].map(function (s) { return '<div><b>' + s[0] + '</b><span>' + s[1] + '</span></div>' }).join('');
        $('#list').innerHTML = out.length ? out.map(function (j) {
            var sk = (j.skills || []).map(function (s) { return '<span class="chip' + (j.sc.hit.indexOf(s) > -1 ? ' hit' : '') + '">' + esc(s) + '</span>' }).join('');
            var w = j.sc.why, ok = [], no = [];
            if (j.sc.hit.length) ok.push(j.sc.hit.join(', ') + ' matched'); if (w.exp) ok.push('level fits'); if (w.loc) ok.push('location fits'); if (w.edu) ok.push('education fits');
            if (j.sc.miss.length) no.push('missing ' + j.sc.miss.join(', ')); if (!w.exp) no.push('level differs'); if (!w.loc) no.push('location differs');
            var metaParts = [j.company, j.location, j.type, j.level, (j.remote && j.remote !== 'onsite' ? j.remote : ''), j.salary].filter(Boolean);
            return '<article class="job"><div class="ring" style="--p:' + j.sc.n + '"><i>' + j.sc.n + '%</i></div><div><h3>' + esc(j.title) + '</h3><div class="meta">' + metaParts.map(esc).join(', ') + ', posted ' + ago(j.posted) + '</div>'
                + '<div class="chips">' + sk + '</div>' + (j.education ? '<div class="why">Education: ' + esc(j.education) + '</div>' : '')
                + '<div class="why">' + (ok.length ? '<span class="ok">Fits: ' + esc(ok.join('; ')) + '.</span> ' : '') + (no.length ? '<span class="no">Check: ' + esc(no.join('; ')) + '.</span>' : '') + '</div>'
                + (j.description ? '<div class="why">' + esc(j.description.slice(0, 240)) + '</div>' : '')
                + '<div class="acts"><a href="' + esc(j.urls[0]) + '" target="_blank" rel="noopener">View job</a><span class="found">Found on ' + esc(j.srcs.join(', ')) + '</span></div></div></article>'
        }).join('') : '<div class="empty">No Jobs Match These Filters. Lower the Minimum Match, Reset the Filters, or Import New Jobs.</div>';
    }
    function srcs() { var q = lc($('#sf').value), rows = S.sources.filter(function (s) { return !q || lc(s.name + ' ' + s.url + ' ' + s.kind).indexOf(q) > -1 }); $('#srccount').textContent = ' ' + rows.length + ' shown, ' + S.sources.length + ' total, ' + S.sources.filter(function (s) { return s.on }).length + ' enabled'; $('#srctable').innerHTML = '<table><tr><th>On</th><th>Name</th><th>Type</th><th>Note</th><th></th></tr>' + rows.map(function (s) { return '<tr><td><input type="checkbox" data-on="' + s.id + '"' + (s.on ? ' checked' : '') + ' aria-label="Enabled"></td><td><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></td><td>' + esc(s.kind) + '</td><td>' + esc(s.note || '') + '</td><td><button class="b g" data-del="' + s.id + '">Remove</button></td></tr>' }).join('') + '</table>' }
    function prof() { var p = S.profile; $('#pr').value = p.roles.join(', '); $('#ps').value = p.skills.join(', '); $('#pe').value = p.education.join(', '); $('#pl').value = p.locations.join(', '); $('#pv').value = p.levels.join(', '); $('#pt').value = p.time; $('#pm').value = p.min }
    function ordinal(n) { var m = n % 100; return n + (m >= 11 && m <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th') }
    function nextScan() { var p = S.profile.time.split(':'), now = new Date(), d = new Date(now); d.setHours(+p[0], +p[1], 0, 0); if (d < now) d.setDate(d.getDate() + 1); var tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); var label = d.toDateString() === tomorrow.toDateString() ? 'Tomorrow' : 'Today'; $('#next').textContent = 'Next Daily Scan: ' + label + ' - ' + ordinal(d.getDate()) + ' of ' + d.toLocaleString([], { month: 'long', year: 'numeric' }) + ', ' + d.toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' }) }
    $('#tabs').addEventListener('click', function (e) { var t = e.target.dataset.t; if (!t) return; document.querySelectorAll('nav button').forEach(function (b) { b.classList.toggle('on', b === e.target) });['jobs', 'sources', 'profile', 'import'].forEach(function (n) { $('#t-' + n).hidden = n !== t }); $('#stats').style.display = (t === 'jobs') ? '' : 'none'; });
    function fl() { F = { q: $('#q').value, s: $('#fs').value, l: $('#fl').value, t: $('#ft').value, e: $('#fe').value, st: $('#fst').value, m: +$('#fm').value, o: $('#so').value }; S.filt = F; save(); render() }
    ['q', 'fs', 'fl', 'ft', 'fe', 'fst', 'fm', 'so'].forEach(function (i) {
        var el = $('#' + i);
        if (el) {
            el.addEventListener('input', fl);
            el.addEventListener('change', fl);
        }
    });
    $('#reset').onclick = function () { F = {}; S.filt = F; save(); render() };
    $('#themeToggle').onclick = function () {
        var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('jf-theme', next) } catch (e) { }
        var label = next === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
        $('#themeToggle').setAttribute('aria-label', label);
        $('#themeToggle').setAttribute('title', label);
    };

    $('#addsrc').onclick = function () { var n = $('#sn').value.trim(), u = $('#su').value.trim(); if (!n || !/^https?:\/\//.test(u)) { alert('Enter a name and a URL starting with http:// or https://'); return } S.sources.push({ id: Date.now(), name: n, url: u, kind: $('#sk').value, on: true }); $('#sn').value = $('#su').value = ''; save(); syncScanner(); srcs() };
    $('#srctable').addEventListener('click', function (e) { var d = e.target.dataset.del; if (d) { S.sources = S.sources.filter(function (s) { return s.id != d }); save(); syncScanner(); srcs() } });
    $('#srctable').addEventListener('change', function (e) { var o = e.target.dataset.on; if (o) { S.sources.forEach(function (s) { if (s.id == o) s.on = e.target.checked }); save(); syncScanner() } });
    $('#saveprof').onclick = function () { S.profile = { roles: list($('#pr').value), skills: list($('#ps').value), education: list($('#pe').value), locations: list($('#pl').value), levels: list($('#pv').value), time: $('#pt').value || '07:00', min: +$('#pm').value || 0 }; F.m = S.profile.min; save(); syncScanner(); nextScan(); render(); alert('Profile Saved') };
    $('#doimp').onclick = function () {
        var a; try { a = JSON.parse($('#imp').value) } catch (e) { $('#impmsg').textContent = 'That is not valid JSON.'; return }
        if (!Array.isArray(a)) a = [a]; var n = 0; S.jobs = S.jobs.filter(function (j) { return !j.sample });
        a.forEach(function (j) { if (j && j.title && j.company) { S.jobs.push({ title: j.title, company: j.company, location: j.location || '', type: j.type || '', level: j.level || '', remote: lc(j.remote || 'onsite'), skills: j.skills || [], education: j.education || '', salary: j.salary || '', posted: j.posted || new Date().toISOString(), url: j.url || '#', source: j.source || 'Imported', description: j.description || '' }); n++ } });
        save(); $('#impmsg').textContent = n + ' Jobs Imported.'; $('#imp').value = ''; render()
    };
    $('#clr').onclick = function () { if (confirm('Remove All Jobs from this Browser?')) { S.jobs = []; save(); render() } };
    // $('#cfg').onclick = function () { syncScanner(); var b = new Blob([JSON.stringify({ scan_time: S.profile.time, sources: S.sources.filter(function (s) { return s.on }), profile: S.profile }, null, 2)], { type: 'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'settings.json'; a.click() };
    $('#scan').onclick = function () { if (location.protocol === 'file:') { alert('Start Scanner.py and open http://127.0.0.1:8765/index.html first.'); return } $('#scan').disabled = true; $('#scanmsg').textContent = 'Scanning...'; fetch('/api/scan', { method: 'POST' }).then(function (r) { return r.json() }).then(function () { return fetch('/api/jobs') }).then(function (r) { return r.ok ? r.json() : null }).then(function (a) { if (Array.isArray(a)) { S.jobs = a; save(); render(); var total = jobs().length; var message = 'Scan complete: ' + total + ' jobs found.'; $('#scanmsg').textContent = message; $('#impmsg').textContent = message } }).catch(function () { $('#scanmsg').textContent = 'Scanner is not Running.'; $('#impmsg').textContent = 'Scanner is not Running.' }).finally(function () { $('#scan').disabled = false }) };
    function syncCachedJobs() {
        var updated = false;
        (S.jobs || []).forEach(function (j) {
            if (!j.location) { var l = inferJobLoc(j); if (l) { j.location = l; updated = true; } }
            if (!j.type) { var t = inferJobType(j); if (t) { j.type = t; updated = true; } }
            if (!j.level) { var e = inferJobLevel(j); if (e) { j.level = e; updated = true; } }
            var rm = inferJobRemote(j); if (rm && rm !== j.remote) { j.remote = rm; updated = true; }
        });
        if (updated) save();
    }
    $('#sf').addEventListener('input', srcs); srcs(); prof(); syncCachedJobs(); nextScan(); render(); loadServerSettings(); loadServerJobs();
})();