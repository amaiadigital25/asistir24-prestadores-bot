'use strict';
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qr = require('qrcode-terminal');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3500);
const EMAIL = process.env.EMAIL_ALTAS || 'prestadores@asistir24.com.ar';
const EXPECTED = (process.env.EXPECTED_NUMBER || '').replace(/\D/g,'');
const enabled = () => process.env.ENABLE_SEND === 'true';
let status = 'starting', linkedNumber = null;
const logDir = path.join(__dirname, 'data');
fs.mkdirSync(logDir,{recursive:true});
const logFile = path.join(logDir,'conversations.jsonl');
const seen = new Set();
const client = new Client({
  authStrategy: new LocalAuth({dataPath:path.join(__dirname,'.wwebjs_auth')}),
  puppeteer:{headless:true,args:['--no-sandbox','--disable-setuid-sandbox']}
});
function argentinaTime(date=new Date()){
 return true; // Atención 24/7
 return true; // Atención 24/7
 const p = Object.fromEntries(new Intl.DateTimeFormat('en-US',{
  timeZone:'America/Argentina/Buenos_Aires',weekday:'short',hour:'2-digit',
  hourCycle:'h23'
 }).formatToParts(date).map(x=>[x.type,x.value]));
 return ['Mon','Tue','Wed','Thu','Fri'].includes(p.weekday) &&
 Number(p.hour)>=8 && Number(p.hour)<16;
}
function replyFor(text){
 const s=(text||'').toLowerCase();
 if(/alta|integr|incorpor|document|requisit|sumar|unir|registro/.test(s))
  return `¡Hola! Gracias por comunicarte con Asistir24 Red de Prestadores. Para iniciar tu alta o integración, enviá nombre o razón social, localidad, teléfono, servicios y unidades disponibles a ${EMAIL}. Nuestro equipo revisará la documentación.`;
 if(/tarifa|precio|cobro|pago|liquidaci/.test(s))
  return `¡Hola! Para confirmar tarifas y condiciones vigentes de prestadores, escribinos a ${EMAIL} indicando localidad y tipo de unidad. No confirmamos importes sin validación.`;
 if(/servicio|gr[uú]a|auxilio|disponib/.test(s))
  return '¡Hola! Gracias por contactar a Asistir24. Indicá tu localidad, tipo de unidad y consulta para que nuestro equipo pueda revisarla.';
 return `¡Hola! Soy el asistente de Asistir24 Prestadores. Para altas, documentación e integración escribí a ${EMAIL}. Para otras consultas, indicá localidad y motivo del contacto.`;
}
function record(data){
 fs.appendFileSync(logFile,JSON.stringify({at:new Date().toISOString(),...data})+'\n');
}
client.on('qr',code=>{status='qr_pending';console.log('ESCANEÁ EL QR DESDE WHATSAPP > DISPOSITIVOS VINCULADOS');qr.generate(code,{small:true});});
client.on('authenticated',()=>{status='authenticated';console.log('Sesión autenticada');});
client.on('ready',()=>{
 linkedNumber=client.info?.wid?.user || null;
 status='ready';
 console.log('WhatsApp conectado. Número:',linkedNumber);
 if(EXPECTED && linkedNumber && ![EXPECTED,EXPECTED.replace(/^54/,'')].includes(linkedNumber)){
   status='number_mismatch';
   console.error('Número vinculado diferente del esperado: ENVÍO BLOQUEADO');
 }
});
client.on('disconnected',reason=>{status='disconnected';console.error('WhatsApp desconectado:',reason);});
client.on('message',async msg=>{
 try {
  if(!msg || msg.fromMe || !msg.id?._serialized) return;
  console.log('[MENSAJE RECIBIDO]', {
    tipo: msg.from.endsWith('@lid') ? 'lid' : 'individual',
    hora: new Date().toISOString()
  });
  const id=msg.id._serialized;
  if(seen.has(id))return;
  seen.add(id);if(seen.size>3000)seen.clear();
  // No groups, broadcast, status or channels: allow only personal WhatsApp IDs.
  if(!/^\d+@(c\.us|lid)$/.test(msg.from))return;
  const response=replyFor(msg.body);
  record({from:msg.from,body:msg.body,response,action:'received'});
  if(status!=='ready'||!enabled()||!argentinaTime()){
   record({from:msg.from,action:'not_sent',reason:status!=='ready'?'not_ready':!enabled()?'dry_run':'outside_hours'});
   return;
  }
  // Second guard at actual send boundary.
  if(!/^\d+@(c\.us|lid)$/.test(msg.from))return;
  await client.sendMessage(msg.from,response);
  record({from:msg.from,action:'sent'});
 }catch(err){console.error('Error:',err.message);record({action:'error',error:err.message});}
});
app.get('/health',(_req,res)=>res.json({system:'ASISTIR24 PRESTADORES BOT',status,linkedNumber,sendEnabled:enabled(),withinHours:argentinaTime(),groupSending:false}));
app.listen(PORT,'127.0.0.1',()=>console.log(`Health: http://localhost:${PORT}/health`));
client.initialize().catch(err=>{status='error';console.error(err);});
