// ============================================================
// עמודי הפרויקטים (landing/projects/*): התנהגות משותפת
// נטען עם defer. הקוד מועתק מדף הבית (index.html), כדי שההתנהגות תהיה זהה.
// עמוד שיש בו תנועה משלו נרשם ל-window.rpMotion, כדי שכפתור העצירה יעצור גם אותה.
// ============================================================

// מדידה: רק באתר החי, כדי שבדיקות מקומיות לא ייכנסו לנתונים
(function(){
  var LIVE = /(^|\.)rubinproject\.com$/.test(location.hostname);
  var GA4_ID = 'G-H747FKHF3H';
  var CLARITY_ID = 'z5g16xx34y';
  if (LIVE && GA4_ID) {
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', GA4_ID);
  }
  if (LIVE && CLARITY_ID) {
    (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script',CLARITY_ID);
  }
  window.rpTrack = function(name, params){
    if (window.gtag) gtag('event', name, params || {});
    if (window.clarity) clarity('event', name);
  };
})();

// תפריט נייד
(function(){
  const burger=document.getElementById('burger'),navLinks=document.getElementById('navLinks');
  if(!burger||!navLinks)return;
  const set=open=>{navLinks.classList.toggle('open',open);burger.setAttribute('aria-expanded',open?'true':'false');burger.setAttribute('aria-label',open?'סגירת תפריט':'פתיחת תפריט');};
  burger.addEventListener('click',()=>set(!navLinks.classList.contains('open')));
  navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navLinks.classList.contains('open')){set(false);burger.focus();}});
})();

// קישור שנפתח בטאב חדש מודיע על כך לקורא מסך
document.querySelectorAll('a[target="_blank"]').forEach(a=>{
  if(a.hasAttribute('aria-label'))a.setAttribute('aria-label',a.getAttribute('aria-label')+' (נפתח בטאב חדש)');
  else a.insertAdjacentHTML('beforeend','<span class="sr"> (נפתח בטאב חדש)</span>');
});
document.querySelectorAll('[data-track]').forEach(a=>a.addEventListener('click',()=>window.rpTrack(a.dataset.track,{page:location.pathname})));

// חשיפה בגלילה
(function(){
  const els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){els.forEach(el=>el.classList.add('in'));return;}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  els.forEach(el=>io.observe(el));
})();

// עצירת תנועה: כפתור קבוע שעוצר את כל מה שזז לבד (WCAG 2.2.2). הבחירה נשמרת לביקור הבא, משותפת לכל האתר
window.rpMotion=(function(){
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const subs=[];
  let paused=reduce;
  if(!reduce){try{paused=localStorage.getItem('rp-motion')==='off';}catch(e){}}
  const btn=document.getElementById('motionBtn');
  const apply=()=>{
    document.documentElement.classList.toggle('motion-off',paused&&!reduce);
    if(btn){const lbl=btn.querySelector('.lbl');lbl.textContent=paused?'הפעלת תנועה':'עצירת תנועה';btn.setAttribute('aria-label',lbl.textContent);btn.title=lbl.textContent;}
  };
  apply();
  if(btn&&!reduce)btn.addEventListener('click',()=>{
    paused=!paused;apply();
    try{localStorage.setItem('rp-motion',paused?'off':'on');}catch(e){}
    subs.forEach(fn=>fn(paused));
  });
  return {reduce,get paused(){return paused;},onChange(fn){subs.push(fn);}};
})();

// פסים נעים (הקולאז' ב-hero ופס הטכנולוגיות): מונעים ב-JS ולא באנימציית CSS, שנוטה להיעלם באייפון.
// כמו בדף הבית. נעצרים מחוץ למסך, בכפתור העצירה ובפחות תנועה
(function(){
  const M=window.rpMotion;
  const lanes=[...document.querySelectorAll('[data-lane]')].map(el=>{
    const track=el.querySelector('.lane-track'),group=track.firstElementChild;
    const lane={el,track,group,x:0,unit:0,on:false,speed:+el.dataset.speed||30,dir:el.dataset.dir==='-1'?-1:1};
    lane.fill=()=>{
      let n=track.children.length;
      while(n<12&&(n<2||track.scrollWidth<el.clientWidth+group.offsetWidth*2)){
        const c=group.cloneNode(true);c.setAttribute('aria-hidden','true');c.querySelectorAll('img').forEach(i=>{i.alt='';});track.appendChild(c);n++;
      }
      lane.unit=group.offsetWidth;
    };
    lane.fill();return lane;
  });
  if(!lanes.length||M.reduce)return;
  let raf=0,last=0;
  const tick=t=>{
    const dt=last?Math.min(.05,(t-last)/1000):0;last=t;let any=false;
    lanes.forEach(l=>{if(M.paused||!l.on||!l.unit)return;any=true;l.x=((l.x+l.dir*l.speed*dt)%l.unit+l.unit)%l.unit;l.track.style.transform=`translate3d(${l.x.toFixed(2)}px,0,0)`;});
    if(any)raf=requestAnimationFrame(tick);else{raf=0;last=0;}
  };
  const kick=()=>{if(!raf&&!M.paused)raf=requestAnimationFrame(tick);};
  M.onChange(kick);
  const lio=new IntersectionObserver(es=>es.forEach(e=>{const l=lanes.find(x=>x.el===e.target);l.on=e.isIntersecting;if(l.on)kick();}),{rootMargin:'120px 0px'});
  lanes.forEach(l=>lio.observe(l.el));
  const refill=()=>lanes.forEach(l=>l.fill());
  window.addEventListener('resize',refill);
  if(document.fonts)document.fonts.ready.then(refill);
})();

// הקולאז' ב-hero נמשך עד תחילת הטקסט, עם חפיפה קבועה של 44px (המרווח שעמית בחר בדף הבית)
(function(){
  const hero=document.querySelector('.p-hero'),col=hero&&hero.querySelector('.collage');
  if(!col)return;
  const wide=window.matchMedia('(min-width:921px)'),texts=hero.querySelectorAll('h1,.p-lead');
  const fit=()=>{
    if(!wide.matches){hero.style.removeProperty('--collage-w');return;}
    let left=Infinity;
    texts.forEach(el=>{const r=document.createRange();r.selectNodeContents(el);[...r.getClientRects()].forEach(b=>{if(b.width)left=Math.min(left,b.left);});});
    if(left===Infinity)return;
    const hb=hero.getBoundingClientRect();
    hero.style.setProperty('--collage-w',Math.round(left-hb.left+hb.width*.03+44)+'px');
  };
  fit();window.addEventListener('resize',fit);
  if(document.fonts)document.fonts.ready.then(fit);
})();

// הדגשת הסקשן הנוכחי בתפריט
(function(){
  const nav=document.getElementById('navLinks');if(!nav)return;
  const links=[...nav.querySelectorAll('a[href^="#"]')],map=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
  const sio=new IntersectionObserver(es=>es.forEach(e=>{
    const a=map.get(e.target.id);if(!a)return;
    if(e.isIntersecting){links.forEach(x=>{x.classList.remove('is-cur');x.removeAttribute('aria-current');});a.classList.add('is-cur');a.setAttribute('aria-current','true');}
    else if(a.classList.contains('is-cur')){a.classList.remove('is-cur');a.removeAttribute('aria-current');}
  }),{rootMargin:'-45% 0px -50% 0px'});
  map.forEach((a,id)=>{const s=document.getElementById(id);if(s)sio.observe(s);});
})();

// גלולה צפה "בואו נדבר": אחרי ה-hero, ולא בסקשן הסיום
(function(){
  const dock=document.getElementById('dock'),hero=document.querySelector('.p-hero'),end=document.querySelector('.p-end');
  if(!dock||!hero)return;
  let heroIn=true,endIn=false;
  const set=()=>{const show=!heroIn&&!endIn;dock.classList.toggle('show',show);dock.inert=!show;};
  new IntersectionObserver(es=>{heroIn=es[0].isIntersecting;set();},{threshold:0}).observe(hero);
  if(end)new IntersectionObserver(es=>{endIn=es[0].isIntersecting;set();},{threshold:0}).observe(end);
})();

// הגדלה בלחיצה: כפתור .zoomable. התמונה הגדולה ב-data-full (על הכפתור או על התמונה), והכיתוב ב-data-cap או ב-alt
(function(){
  const dlg=document.getElementById('lb');if(!dlg)return;
  const body=dlg.querySelector('.lb-body');let opener=null;
  document.querySelectorAll('.zoomable').forEach(btn=>btn.addEventListener('click',()=>{
    // בכרטיס עם מסכים מתחלפים מוגדל המסך שמוצג עכשיו (img.on), בגרסה הגדולה שלו (data-full)
    const img=btn.querySelector('img.on')||btn.querySelector('img');
    body.innerHTML='';
    const big=document.createElement('img');big.src=img.dataset.full||btn.dataset.full||img.currentSrc||img.src;big.alt=img.alt;body.appendChild(big);
    const cap=btn.dataset.cap||img.alt;
    if(cap){const p=document.createElement('p');p.className='lb-cap';p.textContent=cap;body.appendChild(p);}
    opener=btn;dlg.showModal();
  }));
  dlg.addEventListener('close',()=>{body.innerHTML='';if(opener)opener.focus();});
  dlg.querySelector('.lb-close').addEventListener('click',()=>dlg.close());
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
})();

// תאורת עכבר: עיגול רך שנגרר אחרי הסמן, רק במכשירים עם עכבר
(function(){
  const glow=document.getElementById('cglow');
  if(!glow||window.rpMotion.reduce||!window.matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  let gx=0,gy=0,tx=0,ty=0,on=false,gr=0;
  const loop=()=>{gx+=(tx-gx)*.16;gy+=(ty-gy)*.16;glow.style.transform=`translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0)`;gr=Math.abs(tx-gx)+Math.abs(ty-gy)>.3?requestAnimationFrame(loop):0;};
  document.addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;if(!on){on=true;gx=tx;gy=ty;glow.classList.add('is-on');}if(!gr)gr=requestAnimationFrame(loop);},{passive:true});
  document.documentElement.addEventListener('mouseleave',()=>{on=false;glow.classList.remove('is-on');});
})();

// ============================================================
// מופעים משותפים נוספים (2026-11-05). כל אחד פועל רק אם יש בעמוד את ה-HTML שלו. ראו project-pages-playbook.md.
// ============================================================

// מספרים שרצים: [data-count]. הטקסט ב-HTML הוא הערך הסופי. סופר מ-0 פעם אחת כשהמספר נכנס למסך (1.3 שניות).
// ספירה חד פעמית קצרה מ-5 שניות, ולכן היא ממשיכה גם בעצירה, כמו בדף הסטודיו. בפחות תנועה מוצג הערך הסופי
(function(){
  const els=[...document.querySelectorAll('[data-count]')];if(!els.length||window.rpMotion.reduce)return;
  const fmt=(el,v)=>{let s=v.toFixed(+(el.dataset.dec||0));
    if(el.hasAttribute('data-sep')){const p=s.split('.');s=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,',')+(p[1]?'.'+p[1]:'');}
    return (el.dataset.pre||'')+s+(el.dataset.suf||'');};
  const run=el=>{const to=+el.dataset.count,t0=performance.now(),D=1300;
    const step=now=>{const k=Math.min(1,(now-t0)/D);el.textContent=fmt(el,to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step);};
    requestAnimationFrame(step);};
  els.forEach(el=>el.textContent=fmt(el,0));
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io.unobserve(e.target);
    setTimeout(()=>run(e.target),+(e.target.dataset.delay||0));}),{threshold:.5});
  els.forEach(el=>io.observe(el));
})();

// סיור על צילום: [data-tour]. כל 2.8 שניות מסגרת נדלקת סביב האזור הבא בצילום (.pp-zone[data-i]) והשורה שלו ברשימה ([data-tour-i]).
// רק כשהסקשן על המסך. כפתור העצירה עוצר. ריחוף על שורה בוחר אותה ומפסיק את המעבר האוטומטי. בפחות תנועה אין מסגרות
(function(){
  const M=window.rpMotion;
  document.querySelectorAll('[data-tour]').forEach(box=>{
    const pins=[...box.querySelectorAll('.pp-zone')],rows=[...box.querySelectorAll('[data-tour-i]')],N=pins.length;
    if(!N||M.reduce)return;
    let i=-1,auto=true,vis=false,tm=0;
    const set=k=>{i=k;pins.forEach(p=>p.classList.toggle('on',+p.dataset.i===k));rows.forEach(r=>r.classList.toggle('on',+r.dataset.tourI===k));};
    const next=()=>{clearTimeout(tm);if(!auto||!vis||M.paused)return;tm=setTimeout(()=>{set((i+1)%N);next();},2800);};
    box.classList.add('pp-tour-on');
    rows.forEach(r=>r.addEventListener('mouseenter',()=>{auto=false;clearTimeout(tm);set(+r.dataset.tourI);}));
    new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis){if(i<0)set(0);next();}else clearTimeout(tm);},{threshold:.3}).observe(box);
    M.onChange(()=>next());
  });
})();

// "יוצא לדרך": .stmt[data-sgo]. הפריט שבמרכז מתפצל לארבעה עותקים שעפים במסלולים מעוקלים אל מחשב, טלפון, חוברת ומסך
// בחדר ישיבות, והמסך של כל מכשיר נדלק כשהעותק נוחת. רץ פעם אחת בכל כניסה, ומתאפס כשהרצועה יוצאת לגמרי מהמסך.
// כמה פריטים: data-sgo-covers="url1,url2" (בכל ריצה הבא), והמפתח לזכירה בין ביקורים ב-data-sgo-key.
// הועתק מדף הסטודיו. כל המופע הוא פונקציה של זמן (render), ולכן בעצירה ובפחות תנועה מוצג המצב הסופי
(function(){
  const M=window.rpMotion,box=document.querySelector('.stmt[data-sgo]');if(!box)return;
  const st=box.querySelector('.sgo'),src=st.querySelector('.sgo-src'),devs=[...st.querySelectorAll('.sgo-dev')],flies=[...st.querySelectorAll('.sgo-fly')];
  const clamp=v=>v<0?0:v>1?1:v,seg=(t,a,b)=>clamp((t-a)/(b-a)),ease=x=>1-Math.pow(1-x,3),eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
  const END=3900;let G=null;
  const COV=(box.dataset.sgoCovers||'').split(',').filter(Boolean),KEY=box.dataset.sgoKey||'',imgs=[...st.querySelectorAll('img.sgo-c')];
  let ci=0;try{if(KEY&&COV.length>1){const s=localStorage.getItem(KEY);if(s!==null)ci=(+s+1)%COV.length;}}catch(e){}
  const cover=i=>{if(COV.length<2)return;imgs.forEach(im=>{if(im.getAttribute('src')!==COV[i])im.src=COV[i];});new Image().src=COV[(i+1)%COV.length];};
  const size=()=>{
    const W=st.clientWidth,H=st.clientHeight,nar=W<640;
    const sw=Math.min(nar?W*.44:W*.24,240),sx=(W-sw)/2,sy=nar?6:4;
    const conf=nar?[[.27,.5,.46],[.8,.5,.17],[.24,.9,.4],[.75,.9,.46]]:[[.12,.86,.21],[.31,.86,.07],[.52,.86,.19],[.82,.86,.28]];
    src.style.width=sw+'px';src.style.transform='translate('+sx+'px,'+sy+'px)';
    G={src:{x:sx,y:sy,w:sw},dev:[]};
    devs.forEach((d,i)=>{
      const [cx,cy,wf]=conf[i],scr=d.querySelector('.sgo-scr'),w=W*wf;scr.style.width=w+'px';
      const im=d.querySelector('.sgo-img'),sh=w*im.height/im.width,dw=d.offsetWidth,x=cx*W-dw/2,y=cy*H-sh;
      d.style.transform='translate('+x+'px,'+y+'px)';
      const b=st.getBoundingClientRect(),s=d.querySelector('.sgo-scr .sgo-c').getBoundingClientRect();
      G.dev.push({x:s.left-b.left,y:s.top-b.top,w:s.width||scr.getBoundingClientRect().width});
    });
  };
  const render=t=>{
    if(!G)return;
    const a=ease(seg(t,0,550));
    src.style.opacity=(a*(1-.4*seg(t,3200,3800))).toFixed(3);
    src.style.transform='translate('+G.src.x+'px,'+(G.src.y+(1-a)*14)+'px) scale('+(.9+.1*a).toFixed(3)+')';
    flies.forEach((f,i)=>{
      const s0=700+i*170,k=eio(seg(t,s0,s0+1050)),d=G.dev[i];
      const x0=G.src.x+G.src.w*.25,y0=G.src.y+G.src.w*.14,x2=d.x,y2=d.y,x1=(x0+x2)/2,y1=Math.min(y0,y2)-st.clientHeight*.22;
      const x=(1-k)*(1-k)*x0+2*(1-k)*k*x1+k*k*x2,y=(1-k)*(1-k)*y0+2*(1-k)*k*y1+k*k*y2,w=(G.src.w*.5)+(d.w-G.src.w*.5)*k;
      f.style.width=G.src.w+'px';
      f.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) scale('+(w/G.src.w).toFixed(3)+')';
      f.style.opacity=(k>0&&k<1?Math.min(1,k*6):0).toFixed(3);
      const land=s0+1050,on=seg(t,land-60,land+260),dv=devs[i];
      dv.querySelectorAll('.sgo-on').forEach(e=>e.style.opacity=on.toFixed(3));
      dv.querySelector('span').style.opacity=(.35+.65*seg(t,land+80,land+420)).toFixed(3);
    });
  };
  let armed=true,paused=M.reduce||M.paused,fr=0,t0=0,wait=0;
  const stop=()=>{cancelAnimationFrame(fr);clearTimeout(wait);fr=wait=0;};
  const loop=now=>{const t=now-t0;render(Math.min(t,END));fr=t<END?requestAnimationFrame(loop):0;};
  const ready=next=>{stop();if(next===true&&COV.length>1){ci=(ci+1)%COV.length;cover(ci);}armed=true;render(paused?END:0);};
  const play=()=>{stop();armed=false;t0=performance.now();fr=requestAnimationFrame(loop);try{if(KEY)localStorage.setItem(KEY,ci);}catch(e){}};
  size();cover(ci);ready();
  window.addEventListener('resize',()=>{size();render(armed&&!paused?0:END);});
  if(M.reduce)return;
  new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&armed&&!paused&&!wait)wait=setTimeout(play,250);}),{threshold:.55}).observe(st);
  new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting&&!armed&&!paused)ready(true);}),{threshold:0}).observe(box);
  M.onChange(p=>{paused=p;if(p){stop();armed=false;render(END);}else{ready();const r=st.getBoundingClientRect();if(r.top<innerHeight*.6&&r.bottom>innerHeight*.3)wait=setTimeout(play,250);}});
})();

// שכבות תנועה מעל איורים ([data-fx]): .on רק כשהשכבה על המסך, כדי שלא יצוירו פריימים מחוץ למסך
(function(){
  const els=document.querySelectorAll('[data-fx]');if(!els.length||window.rpMotion.reduce)return;
  const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('on',e.isIntersecting)),{rootMargin:'80px'});
  els.forEach(el=>io.observe(el));
})();
