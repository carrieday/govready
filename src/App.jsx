import { useState, useCallback } from "react";

const VERSION = "1.0";

const PRIORITY_NOTICE_TYPES = ["Sources Sought", "Special Notice", "Presolicitation"];
const TARGET_AGENCIES = ["VA","HHS","CMS","DHS","OPM","SSA","DOD","VETERANS","HEALTH","HOMELAND","PERSONNEL"];

const NAV = [
  { id: "dashboard", icon: "◈", label: "Dashboard" },
  { id: "sam",       icon: "◎", label: "SAM Monitor" },
  { id: "capstat",   icon: "◇", label: "Capability Statement" },
  { id: "rfp",       icon: "◻", label: "RFP Generator" },
];

const DEMO_OPPS = [
  { noticeId:"d1", title:"Organizational Change Management Support for EHR Modernization", type:"Sources Sought", department:"DEPARTMENT OF VETERANS AFFAIRS", subTier:"Veterans Health Administration", postedDate:"2026-05-01", responseDeadLine:"2026-06-15T17:00:00", naicsCode:"541611", _score:97, _analysis:{ relevanceScore:97, priority:"HIGH", whyRelevant:"Exact match — OCM support for VHA EHR modernization. ADKAR methodology is purpose-built for large-scale IT-driven change. Delta's workforce transformation experience maps directly to clinical and administrative staff impacts.", keyRequirements:["Organizational change management methodology (ADKAR/Prosci)","EHR or large-scale IT modernization change support","Stakeholder engagement and communications planning"], suggestedAction:"Respond to Sources Sought", winStrategy:"Position as Prosci-certified OCM specialist with ADKAR expertise tailored to healthcare IT transitions." }},
  { noticeId:"d2", title:"Change Readiness Assessment and Training Program", type:"Sources Sought", department:"OFFICE OF PERSONNEL MANAGEMENT", subTier:"OPM Office of the Director", postedDate:"2026-05-02", responseDeadLine:"2026-06-10T17:00:00", naicsCode:"541611", _score:96, _analysis:{ relevanceScore:96, priority:"HIGH", whyRelevant:"Change readiness assessments and training design are both named Delta service lines. OPM manages HR for the entire federal government — a dream client with government-wide influence.", keyRequirements:["Change readiness assessment design and delivery","Training program development and curriculum design","Federal workforce OCM support"], suggestedAction:"Respond to Sources Sought", winStrategy:"Highlight Prosci's validated change readiness tools and Delta's training design capabilities." }},
  { noticeId:"d3", title:"Workforce Transformation and Stakeholder Engagement Services", type:"Presolicitation", department:"DEPARTMENT OF HEALTH AND HUMAN SERVICES", subTier:"Centers for Medicare and Medicaid Services", postedDate:"2026-05-03", responseDeadLine:"2026-06-20T17:00:00", naicsCode:"541611", _score:95, _analysis:{ relevanceScore:95, priority:"HIGH", whyRelevant:"Workforce transformation and stakeholder engagement are Delta's core competencies. CMS is undergoing significant restructuring making OCM support critical.", keyRequirements:["Workforce transformation strategy","Stakeholder engagement planning","Organizational change communications"], suggestedAction:"Submit capability statement", winStrategy:"Emphasize Delta's integrated approach combining workforce transition with structured stakeholder engagement frameworks." }},
  { noticeId:"d4", title:"Leadership Development and OCM Consulting", type:"Presolicitation", department:"SOCIAL SECURITY ADMINISTRATION", subTier:"Office of Human Resources", postedDate:"2026-05-04", responseDeadLine:"2026-06-25T17:00:00", naicsCode:"541611", _score:93, _analysis:{ relevanceScore:93, priority:"HIGH", whyRelevant:"Leadership development combined with OCM is a strong fit for Delta. SSA is managing significant workforce changes and needs both tactical and strategic change support.", keyRequirements:["Leadership coaching and development","Organizational change management","Workforce transition planning"], suggestedAction:"Monitor for RFP", winStrategy:"Position Delta as a boutique firm offering personalized leadership-OCM integration that larger firms cannot match." }},
  { noticeId:"d5", title:"Training Design and Curriculum Development", type:"Sources Sought", department:"DEPARTMENT OF VETERANS AFFAIRS", subTier:"Veterans Benefits Administration", postedDate:"2026-05-05", responseDeadLine:"2026-06-05T17:00:00", naicsCode:"541611", _score:88, _analysis:{ relevanceScore:88, priority:"HIGH", whyRelevant:"Training design and delivery is a core Delta capability. VA/VBA is a primary target agency with ongoing modernization creating continuous training needs.", keyRequirements:["Instructional design and curriculum development","Adult learning methodology","Federal training delivery"], suggestedAction:"Respond to Sources Sought", winStrategy:"Lead with Delta's ADKAR-aligned training design approach and ability to connect training directly to change adoption metrics." }},
  { noticeId:"d6", title:"Federal Agency Reorganization Advisory Support", type:"Solicitation", department:"DEPARTMENT OF HOMELAND SECURITY", subTier:"CISA", postedDate:"2026-05-06", responseDeadLine:"2026-06-18T17:00:00", naicsCode:"541611", _score:72, _analysis:{ relevanceScore:72, priority:"MEDIUM", whyRelevant:"Agency reorganization support aligns with Delta's federal restructuring experience. DHS/CISA is a target agency undergoing active mission realignment.", keyRequirements:["Organizational restructuring advisory","Change impact assessment","Stakeholder communication planning"], suggestedAction:"Consider teaming", winStrategy:"Consider teaming with a DHS-experienced prime as subcontractor to gain entry while building past performance." }},
];

const DEFAULT_DASHBOARD = {
  gsaOffer:"2585874", uei:"FNG3ZQ4ASEG5", naics:"541611",
  actions:[
    {id:1, text:"Withdraw GSA offer in eOffer (deadline ~Apr 24)", done:false, urgent:true},
    {id:2, text:"Resubmit GSA application under TDR Refresh 31", done:false, urgent:true},
    {id:3, text:"Respond to VA Training Design Sources Sought", done:false, urgent:true},
    {id:4, text:"Respond to OPM Change Readiness Sources Sought", done:false, urgent:true},
    {id:5, text:"Respond to VA EHR OCM Sources Sought", done:false, urgent:false},
    {id:6, text:"Set up SAM.gov saved searches with email alerts", done:false, urgent:false},
    {id:7, text:"Contact VA OSDBU with capabilities statement", done:false, urgent:false},
  ],
  pipeline:[
    {id:1, title:"VA EHR OCM Support", agency:"VA", stage:"Sources Sought", score:97, deadline:"2026-06-15"},
    {id:2, title:"OPM Change Readiness", agency:"OPM", stage:"Sources Sought", score:96, deadline:"2026-06-10"},
    {id:3, title:"HHS Workforce Transformation", agency:"HHS", stage:"Presolicitation", score:95, deadline:"2026-06-20"},
    {id:4, title:"SSA Leadership & OCM", agency:"SSA", stage:"Presolicitation", score:93, deadline:"2026-06-25"},
  ]
};

async function callClaude(userMsg, maxTokens=1500) {
  const r = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens, messages:[{role:"user",content:userMsg}] })
  });
  const d = await r.json();
  return d.content?.find(c=>c.type==="text")?.text || "";
}

function daysLeft(ds) { if (!ds) return null; return Math.ceil((new Date(ds)-new Date())/86400000); }
function fmtDate(ds) { if (!ds) return "—"; return new Date(ds).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
function scoreColor(s) { if (s>=70) return "#10B981"; if (s>=45) return "#8B5CF6"; return "#9CA3AF"; }
function typeColor(t) {
  if (!t) return "#9CA3AF";
  if (t.includes("Sources Sought")||t.includes("Special Notice")) return "#10B981";
  if (t.includes("Presolicitation")) return "#8B5CF6";
  if (t.includes("Solicitation")) return "#EF4444";
  return "#9CA3AF";
}
function urgColor(d) { if (d===null) return "#9CA3AF"; if (d<=5) return "#EF4444"; if (d<=14) return "#F59E0B"; return "#10B981"; }
function priorityStyle(p) {
  if (p==="HIGH") return {bg:"#0D1F14",color:"#4ADE80",border:"#1A3A24"};
  if (p==="MEDIUM") return {bg:"#1A0F2E",color:"#A78BFA",border:"#2D1F4E"};
  return {bg:"#141414",color:"#666",border:"#222"};
}

export default function GovReady() {
  const [page, setPage] = useState("dashboard");
  const [samKey, setSamKey] = useState("");
  const [samKeyInput, setSamKeyInput] = useState("");
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [samOpps, setSamOpps] = useState([]);
  const [samLoading, setSamLoading] = useState(false);
  const [samStatus, setSamStatus] = useState("");
  const [samLastRun, setSamLastRun] = useState("");
  const [samFilter, setSamFilter] = useState("ALL");
  const [samSelected, setSamSelected] = useState(null);
  const [samTab, setSamTab] = useState("list");
  const [draft, setDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
const [draftOpp, setDraftOpp] = useState(null);
  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
  const [capForm, setCapForm] = useState({agency:"",scope:"",differentiator:""});
  const [capResult, setCapResult] = useState("");
  const [capLoading, setCapLoading] = useState(false);
  const [rfpForm, setRfpForm] = useState({title:"",agency:"",scope:"",period:"",smallBiz:"yes",incumbent:""});
  const [rfpResult, setRfpResult] = useState("");
  const [rfpLoading, setRfpLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const toggleAction = (id) => setDashboard(d=>({...d,actions:d.actions.map(a=>a.id===id?{...a,done:!a.done}:a)}));

  const saveSamKey = () => {
    setSamKey(samKeyInput.trim());
    setShowKeyPanel(false);
    setSamStatus("API key saved. Click Run Scan to search live opportunities.");
  };

  const runDemo = () => {
  setSamSelected(null);
  setDraft("");
  setSamTab("list");
  setSamFilter("ALL");
  setDemoMode(true);
  setSamOpps(DEMO_OPPS);
  setSamLastRun(new Date().toLocaleString());
  setSamStatus("Demo mode — showing sample opportunities. Add your SAM.gov API key for live data.");
};

  const quickScore = (o) => {
    let s = 0;
    const t = (o.title||"").toLowerCase();
    const d = (o.department||"").toUpperCase();
    if (PRIORITY_NOTICE_TYPES.some(p=>(o.type||"").includes(p))) s+=20;
    if (TARGET_AGENCIES.some(a=>d.includes(a))) s+=15;
    if (["change management","organizational change","workforce","ocm"].some(k=>t.includes(k))) s+=30;
    if (["transformation","transition","restructur","adkar"].some(k=>t.includes(k))) s+=20;
    if (["training","stakeholder","engagement","development"].some(k=>t.includes(k))) s+=10;
    return Math.min(s,95);
  };

  const runSamScan = useCallback(async () => {
    if (!samKey || samKey.trim() === "") {
      setShowKeyPanel(true);
      setSamStatus("Please enter your SAM.gov API key first.");
      return;
    }
    setSamLoading(true);
    setDemoMode(false);
    setSamStatus("Connecting to SAM.gov...");
    try {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate()-7);
      const pad = n => String(n).padStart(2,'0');
const fromStr = `${from.getMonth()+1}/${pad(from.getDate())}/${from.getFullYear()}`;
const toStr = `${now.getMonth()+1}/${pad(now.getDate())}/${now.getFullYear()}`;
      const url = `https://api.sam.gov/prod/opportunities/v2/search?api_key=${samKey.trim()}&limit=50&postedFrom=${fromStr}&postedTo=${toStr}&naics=541611&active=true`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`SAM.gov error ${r.status} — verify your API key is active`);
      const data = await r.json();
      const raw = data.opportunitiesData || [];
      if (!raw.length) { setSamStatus("No new opportunities in last 7 days. Try again tomorrow."); setSamLoading(false); return; }
      setSamStatus(`Found ${raw.length} opportunities. Scoring...`);
      const scored = raw.map(o=>({...o, _score: quickScore(o), _analysis: null}));
      scored.sort((a,b)=>(b._score||0)-(a._score||0));
      setSamOpps(scored);
      setSamLastRun(new Date().toLocaleString());
      setSamStatus(`Complete — ${scored.length} opportunities found and scored.`);
    } catch(e) {
      setSamStatus(`Error: ${e.message}`);
    } finally {
      setSamLoading(false);
    }
  }, [samKey]);

  const generateDraft = useCallback(async (opp) => {
    setDraftOpp(opp);
    setDraftLoading(true); setDraft(""); setSamTab("draft");
    try {
      const text = await callClaude(`Write a professional federal Sources Sought capability statement response for this opportunity on behalf of a change management consulting firm.
OPPORTUNITY: ${opp.title} | ${opp.department} | ${opp.type}
FIRM: Small change management consulting firm. Capabilities: ADKAR/Prosci OCM, workforce transformation, stakeholder engagement, change readiness assessments, training design, federal reorganization support. GSA MAS 541611 pending.
Write a 1-page response with: company overview, relevant capabilities, why uniquely qualified, differentiators, call to action. Professional federal tone.`);
      setDraft(text);
    } catch(e) { setDraft("Error generating draft. Please try again."); }
    finally { setDraftLoading(false); }
  }, []);

  const generateCapStat = async () => {
    if (!capForm.agency) return;
    setCapLoading(true); setCapResult("");
    try {
      const text = await callClaude(`Generate a professional federal capability statement for a change management consulting firm targeting ${capForm.agency}.
Scope: ${capForm.scope||"general change management consulting"}
Differentiator: ${capForm.differentiator||"ADKAR/Prosci certified, small business agility, federal mission focus"}
Include: company overview, core competencies (ADKAR, OCM, workforce transformation, stakeholder engagement, training design), differentiators, NAICS 541611, contact block placeholder.`);
      setCapResult(text);
    } catch(e) { setCapResult("Error generating. Please try again."); }
    finally { setCapLoading(false); }
  };

  const generateRFP = async () => {
    if (!rfpForm.title||!rfpForm.agency) return;
    setRfpLoading(true); setRfpResult("");
    try {
      const text = await callClaude(`Write a complete federal proposal for: ${rfpForm.title} | ${rfpForm.agency} | ${rfpForm.scope} | Period: ${rfpForm.period||"12 months"} | Small Biz: ${rfpForm.smallBiz}
Firm: Change management consulting. Capabilities: ADKAR/Prosci OCM, workforce transformation, stakeholder engagement, change readiness, training design.
Include: Executive Summary, Technical Approach, Management Approach, Past Performance placeholder, Price narrative placeholder.`, 3000);
      setRfpResult(text);
    } catch(e) { setRfpResult("Error generating. Please try again."); }
    finally { setRfpLoading(false); }
  };

  const samFiltered = samOpps.filter(o => {
    if (samFilter==="HIGH") return (o._score||0)>=70;
    if (samFilter==="SOURCES") return PRIORITY_NOTICE_TYPES.some(t=>(o.type||"").includes(t));
    if (samFilter==="TARGET") return TARGET_AGENCIES.some(a=>(o.department||"").toUpperCase().includes(a));
    return true;
  });

  const urgentActions = dashboard.actions.filter(a=>!a.done&&a.urgent);
  const pendingActions = dashboard.actions.filter(a=>!a.done&&!a.urgent);

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"'DM Mono','Courier New',monospace",background:"#0A0A0F",color:"#E8E6E0",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2A2A3A;border-radius:2px}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;border-radius:6px;transition:all .15s;font-size:12px;color:#555;border:1px solid transparent}
        .nav-item:hover{color:#E8E6E0;background:#14141E}
        .nav-item.active{color:#C8F0D0;background:#0D1F14;border-color:#1A3A24}
        .module{flex:1;overflow-y:auto;padding:28px 32px;background:#0A0A0F}
        .card{background:#0F0F1A;border:1px solid #1E1E2E;border-radius:10px;padding:20px}
        .card-sm{background:#0F0F1A;border:1px solid #1E1E2E;border-radius:8px;padding:14px 16px}
        .label{font-size:10px;letter-spacing:.1em;color:#444;margin-bottom:5px;text-transform:uppercase}
        .muted{font-size:12px;color:#666;line-height:1.6;font-family:'DM Sans',sans-serif}
        .btn-primary{background:#1A4D2E;border:1px solid #2D7A4A;border-radius:6px;color:#C8F0D0;cursor:pointer;padding:9px 18px;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.06em;transition:all .15s}
        .btn-primary:hover{background:#1F5C36}.btn-primary:disabled{opacity:.35;cursor:not-allowed}
        .btn-ghost{background:transparent;border:1px solid #1E1E2E;border-radius:6px;color:#777;cursor:pointer;padding:8px 14px;font-family:'DM Mono',monospace;font-size:11px;transition:all .15s}
        .btn-ghost:hover{border-color:#333;color:#E8E6E0}
        .opp-row{padding:14px 16px;border-bottom:1px solid #141420;cursor:pointer;transition:background .1s}
        .opp-row:hover{background:#0D0D18}.opp-row.sel{background:#0D1A14;border-left:2px solid #2D7A4A}
        .filter-btn{background:transparent;border:1px solid #1E1E2E;border-radius:4px;color:#555;cursor:pointer;padding:3px 10px;font-family:'DM Mono',monospace;font-size:10px;transition:all .1s}
        .filter-btn.on{background:#0D1F14;border-color:#2D7A4A;color:#C8F0D0}
        .tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;color:#555;cursor:pointer;padding:8px 16px;font-family:'DM Mono',monospace;font-size:11px;transition:all .15s}
        .tab-btn.on{color:#C8F0D0;border-bottom-color:#2D7A4A}
        .bar{height:2px;background:#1E1E2E;border-radius:1px;overflow:hidden;margin-top:8px}
        .bar-fill{height:100%;border-radius:1px}
        .inp{width:100%;background:#0A0A0F;border:1px solid #1E1E2E;border-radius:6px;padding:9px 12px;font-family:'DM Mono',monospace;font-size:12px;color:#E8E6E0;transition:border-color .15s}
        .inp:focus{outline:none;border-color:#2D7A4A}.inp::placeholder{color:#333}
        textarea.inp{resize:vertical;line-height:1.7;font-size:11px}
        .action-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #0F0F18}
        .action-row:last-child{border-bottom:none}
        .checkbox{width:16px;height:16px;border-radius:3px;border:1px solid #2D2D3E;cursor:pointer;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .checkbox.done{background:#1A4D2E;border-color:#2D7A4A}
        .pipeline-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #0F0F18}
        .pipeline-row:last-child{border-bottom:none}
        .detail-cell{background:#14141E;border-radius:6px;padding:8px 10px}
        .stat-card{background:#0F0F1A;border:1px solid #1E1E2E;border-radius:8px;padding:16px;text-align:center}
      `}</style>

      {/* SIDEBAR */}
      <div style={{width:220,background:"#07070F",borderRight:"1px solid #141420",display:"flex",flexDirection:"column",padding:"20px 12px",flexShrink:0}}>
        <div style={{marginBottom:28,paddingLeft:4}}>
          <div style={{fontSize:15,fontWeight:500,letterSpacing:".08em",color:"#C8F0D0"}}>GovReady</div>
          <div style={{fontSize:10,color:"#333",letterSpacing:".1em",marginTop:2}}>FEDERAL CONTRACTING TOOLKIT</div>
          <div style={{fontSize:9,color:"#2D7A4A",marginTop:4}}>v{VERSION}</div>
        </div>
        <nav style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
          {NAV.map(n=>(
            <div key={n.id} className={`nav-item${page===n.id?" active":""}`} onClick={()=>setPage(n.id)}>
              <span style={{fontSize:14,width:20,textAlign:"center"}}>{n.icon}</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13}}>{n.label}</span>
            </div>
          ))}
        </nav>
        <div style={{borderTop:"1px solid #141420",paddingTop:16,marginTop:16}}>
          <div style={{fontSize:10,color:"#333",letterSpacing:".08em",marginBottom:4}}>POWERED BY</div>
          <div style={{fontSize:11,color:"#444"}}>Claude AI + SAM.gov</div>
          <div style={{fontSize:10,color:"#2A2A3A",marginTop:4}}>© 2026 GovReady</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* DASHBOARD */}
        {page==="dashboard"&&(
          <div className="module">
            <div style={{marginBottom:28}}>
              <div style={{fontSize:20,fontWeight:500,color:"#E8E6E0"}}>Dashboard</div>
              <div style={{fontSize:12,color:"#444",marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
            </div>
            <div style={{marginBottom:24}}>
              <div style={{fontSize:10,letterSpacing:".14em",color:"#444",marginBottom:12,textTransform:"uppercase"}}>GSA Schedule Status</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:10}}>
                {[{l:"Offer ID",v:dashboard.gsaOffer},{l:"UEI",v:dashboard.uei},{l:"NAICS",v:dashboard.naics},{l:"Expected Award",v:"Late Summer 2026"}].map((s,i)=>(
                  <div key={i} className="stat-card"><div className="label">{s.l}</div><div style={{fontSize:13,fontWeight:500,color:"#C8F0D0"}}>{s.v}</div></div>
                ))}
              </div>
              <div className="card-sm" style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#F59E0B",flexShrink:0}}/>
                <div style={{fontSize:12,color:"#888",fontFamily:"'DM Sans',sans-serif"}}><span style={{color:"#E8E6E0",fontWeight:500}}>Status:</span> Resubmission pending (TDR Refresh 31) — Withdraw by ~Apr 24, resubmit under TDR requirements.</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <div>
                <div style={{fontSize:10,letterSpacing:".14em",color:"#444",marginBottom:12,textTransform:"uppercase"}}>Action Items</div>
                <div className="card">
                  {urgentActions.length>0&&<div style={{marginBottom:12}}>
                    <div style={{fontSize:10,color:"#EF4444",letterSpacing:".1em",marginBottom:8}}>URGENT</div>
                    {urgentActions.map(a=>(
                      <div key={a.id} className="action-row">
                        <div className={`checkbox${a.done?" done":""}`} onClick={()=>toggleAction(a.id)}>{a.done&&<span style={{fontSize:9,color:"#4ADE80"}}>✓</span>}</div>
                        <div style={{fontSize:12,color:a.done?"#444":"#E8E6E0",fontFamily:"'DM Sans',sans-serif",textDecoration:a.done?"line-through":"none",lineHeight:1.5}}>{a.text}</div>
                      </div>
                    ))}
                  </div>}
                  {pendingActions.length>0&&<div>
                    <div style={{fontSize:10,color:"#444",letterSpacing:".1em",marginBottom:8}}>THIS WEEK</div>
                    {pendingActions.map(a=>(
                      <div key={a.id} className="action-row">
                        <div className={`checkbox${a.done?" done":""}`} onClick={()=>toggleAction(a.id)}>{a.done&&<span style={{fontSize:9,color:"#4ADE80"}}>✓</span>}</div>
                        <div style={{fontSize:12,color:a.done?"#444":"#888",fontFamily:"'DM Sans',sans-serif",textDecoration:a.done?"line-through":"none",lineHeight:1.5}}>{a.text}</div>
                      </div>
                    ))}
                  </div>}
                </div>
              </div>
              <div>
                <div style={{fontSize:10,letterSpacing:".14em",color:"#444",marginBottom:12,textTransform:"uppercase"}}>Active Pipeline</div>
                <div className="card">
                  {dashboard.pipeline.map(p=>{
                    const dl=daysLeft(p.deadline);
                    return(
                      <div key={p.id} className="pipeline-row">
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:500,color:"#E8E6E0",marginBottom:3,fontFamily:"'DM Sans',sans-serif"}}>{p.title}</div>
                          <div style={{display:"flex",gap:8,fontSize:10}}>
                            <span style={{color:"#2D7A4A"}}>{p.agency}</span>
                            <span style={{color:"#333"}}>·</span>
                            <span style={{color:"#555"}}>{p.stage}</span>
                            {dl!==null&&<><span style={{color:"#333"}}>·</span><span style={{color:urgColor(dl),fontWeight:500}}>{dl<=0?"PAST DUE":`${dl}d`}</span></>}
                          </div>
                        </div>
                        <div style={{fontSize:16,fontWeight:500,color:scoreColor(p.score)}}>{p.score}</div>
                      </div>
                    );
                  })}
                  <button className="btn-ghost" style={{width:"100%",marginTop:12,fontSize:11}} onClick={()=>setPage("sam")}>Open SAM Monitor →</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SAM MONITOR */}
        {page==="sam"&&(
          <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
            <div style={{padding:"16px 24px",borderBottom:"1px solid #141420",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#07070F",flexShrink:0}}>
              <div>
                <div style={{fontSize:14,fontWeight:500,color:"#E8E6E0"}}>SAM Monitor</div>
                {samLastRun&&<div style={{fontSize:10,color:"#444",marginTop:2}}>Last scan: {samLastRun}{demoMode&&" · DEMO"}</div>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button className="btn-ghost" style={{fontSize:10}} onClick={()=>setShowKeyPanel(p=>!p)}>{samKey?"⚙ Key":"⚙ Add Key"}</button>
                <button className="btn-ghost" style={{fontSize:10}} onClick={runDemo}>Demo</button>
                <button className="btn-primary" onClick={runSamScan} disabled={samLoading}>{samLoading?"Scanning...":"▶ Run Scan"}</button>
              </div>
            </div>

            {showKeyPanel&&(
              <div style={{background:"#0A0A0F",borderBottom:"1px solid #141420",padding:"10px 24px",flexShrink:0}}>
                <div style={{fontSize:10,color:"#444",marginBottom:6,letterSpacing:".08em"}}>SAM.GOV PUBLIC API KEY — get from sam.gov → Account Details → Public API Keys</div>
                <div style={{display:"flex",gap:8,maxWidth:520}}>
                  <input type="text" className="inp" placeholder="SAM-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={samKeyInput} onChange={e=>setSamKeyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveSamKey()} autoComplete="off" autoCorrect="off" spellCheck="false" />
                  <button className="btn-primary" style={{whiteSpace:"nowrap",padding:"8px 14px"}} onClick={saveSamKey}>Save</button>
                </div>
                {samKey&&<div style={{fontSize:10,color:"#2D7A4A",marginTop:5}}>✓ Key active for this session</div>}
              </div>
            )}

            {samStatus&&(
              <div style={{background:"#0D0D18",borderBottom:"1px solid #141420",padding:"7px 24px",fontSize:11,color:"#666",flexShrink:0}}>
                {samLoading&&<span style={{marginRight:8,opacity:.5}}>◌</span>}{samStatus}
              </div>
            )}

            {samOpps.length>0&&(
              <div style={{display:"flex",borderBottom:"1px solid #141420",background:"#07070F",flexShrink:0}}>
                {[{l:"TOTAL",v:samOpps.length},{l:"HIGH PRIORITY",v:samOpps.filter(o=>(o._score||0)>=70).length},{l:"SOURCES SOUGHT",v:samOpps.filter(o=>PRIORITY_NOTICE_TYPES.some(t=>(o.type||"").includes(t))).length},{l:"TARGET AGENCIES",v:samOpps.filter(o=>TARGET_AGENCIES.some(a=>(o.department||"").toUpperCase().includes(a))).length}].map((s,i)=>(
                  <div key={i} style={{flex:1,padding:"10px 20px",borderRight:i<3?"1px solid #141420":"none"}}>
                    <div style={{fontSize:9,letterSpacing:".1em",color:"#333"}}>{s.l}</div>
                    <div style={{fontSize:22,fontWeight:500,color:"#E8E6E0",marginTop:2}}>{s.v}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{borderBottom:"1px solid #141420",padding:"0 24px",display:"flex",background:"#07070F",flexShrink:0}}>
              <button className={`tab-btn${samTab==="list"?" on":""}`} onClick={()=>setSamTab("list")}>OPPORTUNITIES ({samFiltered.length})</button>
              <button className={`tab-btn${samTab==="draft"?" on":""}`} onClick={()=>setSamTab("draft")}>DRAFT RESPONSE</button>
            </div>

            {samTab==="list"&&(
              <div style={{display:"flex",flex:1,overflow:"hidden"}}>
                <div style={{width:"50%",borderRight:"1px solid #141420",display:"flex",flexDirection:"column",overflow:"hidden"}}>
                  <div style={{padding:"8px 14px",borderBottom:"1px solid #141420",display:"flex",gap:6,flexShrink:0}}>
                    {["ALL","HIGH","SOURCES","TARGET"].map(f=>(
                      <button key={f} className={`filter-btn${samFilter===f?" on":""}`} onClick={()=>setSamFilter(f)}>{f}</button>
                    ))}
                  </div>
                  <div style={{overflowY:"auto",flex:1}}>
                    {samFiltered.length===0?(
                      <div style={{textAlign:"center",padding:"60px 20px",color:"#444",fontSize:12}}>
                        <div style={{fontSize:28,marginBottom:12,opacity:.3}}>◎</div>
                        <div style={{marginBottom:8,fontWeight:600,color:"#666"}}>No opportunities loaded</div>
                        <div>Click <strong style={{color:"#C8F0D0"}}>Demo</strong> to preview sample data</div>
                        <div style={{marginTop:4}}>or click <strong style={{color:"#C8F0D0"}}>⚙ Add Key</strong> then <strong style={{color:"#C8F0D0"}}>Run Scan</strong></div>
                      </div>
                    ):samFiltered.map(opp=>{
                      const sc=opp._score||0,an=opp._analysis;
                      const pr=an?.priority||(sc>=70?"HIGH":sc>=45?"MEDIUM":"LOW");
                      const ps=priorityStyle(pr);
                      const dl=daysLeft(opp.responseDeadLine);
                      const isSel=samSelected?.noticeId===opp.noticeId;
                      return(
                        <div key={opp.noticeId} className={`opp-row${isSel?" sel":""}`} onClick={()=>setSamSelected(opp)}>
                          <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:5}}>
                            <div style={{fontSize:12,fontWeight:500,color:"#E8E6E0",lineHeight:1.4,flex:1,fontFamily:"'DM Sans',sans-serif"}}>{opp.title}</div>
                            <div style={{fontSize:15,fontWeight:500,color:scoreColor(sc),flexShrink:0}}>{sc}</div>
                          </div>
                          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",fontSize:10}}>
                            <span style={{color:typeColor(opp.type),fontWeight:500}}>{opp.type}</span>
                            <span style={{color:"#333"}}>·</span>
                            <span style={{color:"#555"}}>{(opp.department||"").replace("DEPARTMENT OF ","").replace("OFFICE OF ","")}</span>
                            {dl!==null&&<><span style={{color:"#333"}}>·</span><span style={{color:urgColor(dl),fontWeight:dl<=5?600:400}}>{dl<=0?"PAST DUE":`${dl}d left`}</span></>}
                            <span style={{marginLeft:"auto",padding:"2px 7px",borderRadius:3,fontSize:9,background:ps.bg,color:ps.color,border:`1px solid ${ps.border}`,fontWeight:600}}>{pr}</span>
                          </div>
                          <div className="bar"><div className="bar-fill" style={{width:`${sc}%`,background:scoreColor(sc)}}/></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{flex:1,overflowY:"auto",padding:20}}>
                  {!samSelected?(
                    <div style={{textAlign:"center",color:"#333",paddingTop:60,fontSize:12}}>
                      <div style={{fontSize:28,marginBottom:12,opacity:.2}}>→</div>Select an opportunity
                    </div>
                  ):(()=>{
                    const an=samSelected._analysis,sc=samSelected._score||0,dl=daysLeft(samSelected.responseDeadLine);
                    return(
                      <div>
                        <div style={{marginBottom:16}}>
                          <div style={{fontSize:14,fontWeight:500,color:"#E8E6E0",lineHeight:1.5,marginBottom:6,fontFamily:"'DM Sans',sans-serif"}}>{samSelected.title}</div>
                          <div style={{fontSize:11,color:"#555"}}>{samSelected.department}{samSelected.subTier?` · ${samSelected.subTier}`:""}</div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                          {[
                            {l:"NOTICE TYPE",v:samSelected.type,c:typeColor(samSelected.type)},
                            {l:"RELEVANCE SCORE",v:`${sc} / 100`,c:scoreColor(sc)},
                            {l:"POSTED",v:samSelected.postedDate||"—"},
                            {l:"DEADLINE",v:samSelected.responseDeadLine?`${fmtDate(samSelected.responseDeadLine)}${dl!==null?` (${dl<=0?"PAST DUE":dl+"d left"})`:""}` :"None",c:dl!==null&&dl<=5?"#EF4444":undefined},
                            {l:"NAICS",v:samSelected.naicsCode||"541611"},
                            {l:"SUGGESTED ACTION",v:an?.suggestedAction||"Review opportunity",c:"#4ADE80"},
                          ].map((item,i)=>(
                            <div key={i} className="detail-cell">
                              <div className="label">{item.l}</div>
                              <div style={{fontSize:11,fontWeight:500,color:item.c||"#E8E6E0"}}>{item.v}</div>
                            </div>
                          ))}
                        </div>
                        {an?.whyRelevant&&<div style={{marginBottom:14}}><div className="label" style={{marginBottom:6}}>WHY THIS FITS</div><div className="muted">{an.whyRelevant}</div></div>}
                        {an?.winStrategy&&<div style={{marginBottom:14,borderLeft:"2px solid #2D7A4A",paddingLeft:12}}><div className="label" style={{marginBottom:4}}>WIN STRATEGY</div><div className="muted">{an.winStrategy}</div></div>}
                        {an?.keyRequirements?.length>0&&<div style={{marginBottom:16}}><div className="label" style={{marginBottom:6}}>KEY REQUIREMENTS</div>{an.keyRequirements.map((r,i)=><div key={i} style={{display:"flex",gap:8,fontSize:12,color:"#888",marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}><span style={{color:"#333",flexShrink:0}}>—</span>{r}</div>)}</div>}
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          <button className="btn-primary" onClick={()=>generateDraft(samSelected)}>✦ Draft Response</button>
                          <button className="btn-ghost" onClick={()=>window.open(`https://sam.gov/opp/${samSelected.noticeId}/view`,"_blank")}>View on SAM.gov ↗</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {samTab==="draft"&&(
              <div style={{flex:1,overflowY:"auto",padding:24}}>
                <div className="label" style={{marginBottom:12}}>{draftOpp?`DRAFT — ${draftOpp.title}`:"SELECT AN OPPORTUNITY FIRST"}
                {draftLoading?<div className="muted" style={{padding:"40px 0"}}>Generating with Claude AI...</div>
                :draft?<>
                  <textarea className="inp" value={draft} onChange={e=>setDraft(e.target.value)} rows={28}/>
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button className="btn-primary" onClick={()=>navigator.clipboard.writeText(draft)}>Copy</button>
                    <button className="btn-ghost" onClick={()=>{setDraft("");setSamTab("list");}}>← Back</button>
                  </div>
                </>:draftOpp?null:<div className="muted">Select an opportunity and click "✦ Draft Response" to generate a capability statement.</div>}
              </div>
            )}
          </div>
        )}

        {/* CAPABILITY STATEMENT */}
        {page==="capstat"&&(
          <div className="module">
            <div style={{fontSize:20,fontWeight:500,color:"#E8E6E0",marginBottom:6}}>Capability Statement Generator</div>
            <div className="muted" style={{marginBottom:28}}>Generate a tailored federal capability statement for any agency or opportunity.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
              <div>
                <div style={{fontSize:10,letterSpacing:".14em",color:"#444",marginBottom:16,textTransform:"uppercase"}}>Opportunity Details</div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {[{label:"Target Agency *",key:"agency",ph:"e.g. Department of Veterans Affairs"},{label:"Opportunity / Scope",key:"scope",ph:"e.g. EHR modernization change management support"},{label:"Key Differentiator",key:"differentiator",ph:"e.g. Prosci-certified, 10+ years federal OCM"}].map(f=>(
                    <div key={f.key}><div className="label" style={{marginBottom:5}}>{f.label}</div>
                    <input className="inp" placeholder={f.ph} value={capForm[f.key]} onChange={e=>setCapForm(p=>({...p,[f.key]:e.target.value}))}/></div>
                  ))}
                  <button className="btn-primary" style={{marginTop:4}} onClick={generateCapStat} disabled={capLoading||!capForm.agency}>{capLoading?"Generating...":"✦ Generate Capability Statement"}</button>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,letterSpacing:".14em",color:"#444",marginBottom:16,textTransform:"uppercase"}}>Generated Statement</div>
                {capLoading?<div className="muted" style={{padding:"40px 0"}}>Generating with Claude AI...</div>
                :capResult?<><textarea className="inp" value={capResult} onChange={e=>setCapResult(e.target.value)} rows={22}/>
                  <button className="btn-primary" style={{marginTop:10}} onClick={()=>navigator.clipboard.writeText(capResult)}>Copy to clipboard</button></>
                :<div className="card" style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:24,marginBottom:12,opacity:.2}}>◇</div><div className="muted">Fill in the details and click Generate</div></div>}
              </div>
            </div>
          </div>
        )}

        {/* RFP GENERATOR */}
        {page==="rfp"&&(
          <div className="module">
            <div style={{fontSize:20,fontWeight:500,color:"#E8E6E0",marginBottom:6}}>RFP / Proposal Generator</div>
            <div className="muted" style={{marginBottom:28}}>Generate a complete federal proposal response from opportunity details.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
              <div>
                <div style={{fontSize:10,letterSpacing:".14em",color:"#444",marginBottom:16,textTransform:"uppercase"}}>Opportunity Details</div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {[{label:"Opportunity Title *",key:"title",ph:"e.g. OCM Support for EHR Modernization"},{label:"Agency *",key:"agency",ph:"e.g. Department of Veterans Affairs"},{label:"Scope of Work",key:"scope",ph:"Brief description of work required"},{label:"Period of Performance",key:"period",ph:"e.g. 12 months base + 2 option years"},{label:"Incumbent (if known)",key:"incumbent",ph:"e.g. Booz Allen Hamilton or Unknown"}].map(f=>(
                    <div key={f.key}><div className="label" style={{marginBottom:5}}>{f.label}</div>
                    <input className="inp" placeholder={f.ph} value={rfpForm[f.key]} onChange={e=>setRfpForm(p=>({...p,[f.key]:e.target.value}))}/></div>
                  ))}
                  <div><div className="label" style={{marginBottom:5}}>SMALL BUSINESS SET-ASIDE</div>
                  <div style={{display:"flex",gap:8}}>
                    {["yes","no","unknown"].map(v=>(
                      <button key={v} className={`filter-btn${rfpForm.smallBiz===v?" on":""}`} onClick={()=>setRfpForm(p=>({...p,smallBiz:v}))} style={{textTransform:"uppercase"}}>{v}</button>
                    ))}
                  </div></div>
                  <button className="btn-primary" style={{marginTop:4}} onClick={generateRFP} disabled={rfpLoading||!rfpForm.title||!rfpForm.agency}>{rfpLoading?"Generating...":"✦ Generate Proposal"}</button>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,letterSpacing:".14em",color:"#444",marginBottom:16,textTransform:"uppercase"}}>Generated Proposal</div>
                {rfpLoading?<div className="muted" style={{padding:"40px 0"}}>Generating full proposal with Claude AI...</div>
                :rfpResult?<><textarea className="inp" value={rfpResult} onChange={e=>setRfpResult(e.target.value)} rows={32}/>
                  <button className="btn-primary" style={{marginTop:10}} onClick={()=>navigator.clipboard.writeText(rfpResult)}>Copy to clipboard</button></>
                :<div className="card" style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:24,marginBottom:12,opacity:.2}}>◻</div><div className="muted">Fill in opportunity details and click Generate</div></div>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
