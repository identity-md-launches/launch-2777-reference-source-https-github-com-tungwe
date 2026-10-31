const dictionary={
 '跳至主要內容':'Skip to content','中文觀測站':'Observatory','WORKSPACE / 觀測空間':'WORKSPACE / OBSERVATORY','頁面導覽':'Page navigation','即時總覽':'Overview','跑輪活動':'Wheel activity','鏈上結算':'Settlements','資料來源':'Data sources','由一隻倉鼠的步伐，':'One hamster. Small steps.','看見鏈上的每一次進展。':'Every step, onchain.','閱讀官方文件 ↗':'Official documentation ↗','獨立社群作品 · 本機預覽版':'Independent project · Local preview','觀測空間':'Observatory','僅本機預覽':'Local preview only',
 '每一圈，都看得見':'Every turn tells a story','。':'.','追蹤跑輪活動、區塊結算與 SQK 發行，讓鏈上數據更好讀。':'Follow the wheel, settled blocks and SQK issuance. Onchain activity, made clear.','↻ 更新資料':'↻ Refresh data','暫停更新':'Pause updates','繼續更新':'Resume updates','正在連接 Squeekchain 公開資料來源…':'Connecting to the Squeekchain public API…','WHEELY9000 / 跑輪觀測':'WHEELY9000 / WHEEL ACTIVITY','等待資料':'Awaiting data','本日累積里程':'Distance this Squeek day','轉速':'Rotation','速度':'Speed','尚未收到感測資料':'No sensor reading yet','資料來源待確認':'Source not yet available','統計日於台灣時間 20:00 換日':'Day boundary: 12:00 UTC / 20:00 Taipei','BLOCK BUILDER / 區塊形成':'BLOCK BUILDER / IN PROGRESS','下一區塊預估進度':'Projected next-block progress','預估區塊高度':'Projected block height','預估進度尚未結算，也不代表已發行 SQK。':'Projected progress is not settled and does not imply SQK issuance.',
 '關鍵數據':'Key metrics','已結算區塊':'Settled blocks','最新已確認的 Squeek 區塊高度':'Latest confirmed Squeek block height','近 24 小時新增區塊':'Blocks added · 24h','結算批次待讀取':'Awaiting settlement batches','近 24 小時發行':'SQK issued · 24h','SQK · 依已處理輪次計算':'SQK · Based on processed rounds','累積觀測里程':'Lifetime observed distance','km · 自資料來源開始觀測':'km · Since observation began',
 '每天的一小步':'Small steps, day by day','活動圖顯示範圍':'Activity chart range','7 天':'7 days','3 天':'3 days','觀測里程（km）':'Observed distance (km)','每日觀測里程長條圖':'Daily observed distance chart','缺少資料以「—」呈現；日期依官方統計日，並非台灣曆日。':'Missing data appears as “—”. Dates follow Squeek days, beginning at 12:00 UTC.','發行進度':'Issuance progress','累積挖礦發行量':'Cumulative mining issuance','Oracle 驗證':'Oracle validation','結算佇列':'Settlement queue','待結算輪次':'Pending rounds','此處為 Sepolia 測試網數據。':'All figures refer to the Sepolia testnet.',
 '最近的鏈上足跡':'Recent onchain footprints','近 24 小時':'Last 24 hours','結算輪次':'Through round','新增區塊':'Blocks added','新增工作量':'Work added','時間（台灣）':'Time (Taipei)','確認狀態':'Confirmation','交易':'Transaction','等待結算資料…':'Awaiting settlements…','鏈上資料採安全確認區塊；索引可能落後即時鏈頭。':'Chain data uses safe blocks. The indexer can lag behind the chain tip.',
 '每個數字，都有來源':'Every number has a source','示範資料模式':'Demo data','如何讀懂這個儀表板？':'How to read this dashboard','即時狀態每 15 秒讀取；統計及結算每 60 秒讀取。切換到其他分頁時暫停請求。連線失敗會逐步延長重試時間；保留的舊資料會標示為過期，不會用零取代未知資料。':'Live status refreshes every 15 seconds; statistics and settlements every 60 seconds. Requests pause when this tab is hidden. Errors trigger backoff. Retained data is marked stale; unknown values are never shown as zero.',
 '跑輪活動、Oracle 驗證、Ethereum 結算、SQK 發行是不同階段，數字不一定同步。金額以整數處理，畫面小數採截取顯示。示範模式使用虛構範例，不會送出 API 請求。':'Wheel activity, Oracle validation, Ethereum settlement and SQK issuance are separate stages, so their figures may differ. Token amounts use exact integers; displayed decimals are truncated. Demo mode uses fictional examples and starts no new API requests.',
 'SQUEEKCHAIN 中文觀測站':'SQUEEKCHAIN OBSERVATORY','/ 獨立社群作品，非官方網站':'/ Independent community project. Not an official site.','公開 API 文件 ↗':'Public API reference ↗',
 '跑輪轉動中':'Wheel turning','跑輪暫歇':'Wheel at rest','非即時資料':'Not live','示範資料':'Demo data','硬體感測':'Hardware sensor','模擬資料':'Simulated','重播資料':'Replayed','推導資料':'Derived','此期間沒有觀測紀錄':'No observations in this window.','尚無活動資料，等待公開 API 回應。':'Awaiting activity from the public API.','此期間沒有結算紀錄':'No settlements in this window.','尚無結算資料，等待公開 API 回應。':'Awaiting settlements from the public API.','安全確認':'Safe','待確認':'Pending','示範':'Demo','已接受':'Accepted','資料過期':'Stale','受阻':'Blocked','暫不可用':'Unavailable','佇列為空':'Empty','等待結算':'Ready','準備中':'Preparing','已送出':'Submitted','重試中':'Retrying','已停用':'Disabled','未知狀態':'Unknown',
 '示範模式：以下全部為虛構範例，僅供檢視介面；不代表目前鏈上狀態。':'DEMO MODE · All figures are fictional examples for previewing the interface, not current onchain data.','已暫停自動更新。畫面保留最後讀取的資料。':'Updates paused. Showing the last retrieved data.','公開資料已取得，但感測讀數過期或暫不可用。':'Public data received, but the sensor reading is stale or unavailable.','公開 API 已連線 · 感測資料新鮮 · 狀態每 15 秒、統計每 60 秒更新。':'Public API connected · Sensor data fresh · Status every 15s, statistics every 60s.',
 '跑輪與驗證':'Wheel & validation','每日觀測統計':'Daily observations','結算與發行':'Settlements & issuance','連線失敗／舊資料':'Connection failed / retained data','官方快取資料':'Upstream cached data','資料已過期':'Data is stale','已連線':'Connected','範例數字不代表目前狀態':'Example figures, not current data','連線逾時':'Connection timed out','資料格式或版本不相容':'Unsupported response format or version','缺少跑輪狀態欄位':'Missing wheel status fields','缺少每日統計欄位':'Missing daily statistics','缺少結算欄位':'Missing settlement fields','資料並非 Sepolia 測試網':'Unexpected network: not Sepolia'
};
let language='en';
try{language=localStorage.getItem('squeek-observatory-language')==='zh-Hant'?'zh-Hant':'en';}catch{}
export const getLanguage=()=>language;
export function setLanguage(value){language=value==='zh-Hant'?'zh-Hant':'en';try{localStorage.setItem('squeek-observatory-language',language);}catch{}}
export function t(text){
 if(language!=='en'||typeof text!=='string')return text;
 const leading=text.match(/^\s*/)[0],trailing=text.match(/\s*$/)[0],key=text.trim();
 if(Object.hasOwn(dictionary,key))return leading+dictionary[key]+trailing;
 return text
 .replace(/^(\d+) 個資料來源尚未就緒、連線失敗或資料過期。已有資料會保留；請查看下方來源狀態。$/, '$1 source(s) unavailable or stale. Retaining existing data; see source details below.')
 .replace(/^感測時間 /,'Sensor reading: ').replace(/^資料覆蓋率 /,'Coverage: ').replace(/ · 覆蓋率 /,' · Coverage: ').replace(/ 個結算批次$/,' settlement batches')
 .replace(/^上限 /,'Cap: ').replace(/^安全確認至 Ethereum 區塊 /,'Safe through Ethereum block ').replace(/ · 索引可能落後即時鏈頭。$/,' · The indexer may lag behind the chain tip.')
 .replace(/^資料產生：/,'Generated: ').replace(/ · 本機讀取：/,' · Retrieved: ')
 .replace(/^官方資料暫不可用/,'Official data unavailable').replace(/^API 回應 /,'API response ')
 .replace(/^查看輪次 (.*) 的交易$/,'View transaction for round $1');
}
let textNodes=[],attributes=[];
export function captureStatic(){
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while(n=walker.nextNode()){if(!['SCRIPT','STYLE'].includes(n.parentElement?.tagName)&&n.textContent.trim())textNodes.push([n,n.textContent]);}
 for(const el of document.querySelectorAll('[aria-label]'))attributes.push([el,el.getAttribute('aria-label')]);
}
export function translateStatic(){
 document.documentElement.lang=language;
 document.title=language==='en'?'Squeekchain Observatory | Live Dashboard':'Squeekchain 觀測站｜即時儀表板';
 for(const [node,text]of textNodes)if(node.isConnected)node.textContent=t(text);
 for(const [el,label]of attributes)el.setAttribute('aria-label',t(label));
}
export function translateDynamic(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())n.textContent=t(n.textContent);
 for(const el of root.querySelectorAll('[aria-label]'))el.setAttribute('aria-label',t(el.getAttribute('aria-label')));
 for(const el of root.querySelectorAll('[title]'))el.setAttribute('title',t(el.getAttribute('title')));
}

