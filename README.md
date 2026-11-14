# ASISTIR24 Prestadores Bot

Bot experimental con WhatsApp Web no oficial. Riesgo de bloqueo o desconexión de la cuenta.
Requiere Node.js 20/22, npm y librerías de Chromium en WSL.

## Instalación
`bash install.sh`
`npm start`

Escanear QR con WhatsApp > Dispositivos vinculados.
Verificar `curl http://localhost:3500/health` y que `linkedNumber` sea el esperado.
En `.env`, `ENABLE_SEND=false` impide enviar mensajes durante pruebas.
Solo después de verificar el número y probar mensajes individuales, cambiar a `ENABLE_SEND=true` y reiniciar.

## Limitaciones
No responde fuera de lunes a viernes 08:00–16:00 (Buenos Aires).
No envía mensajes a grupos ni listas; solo a identificadores `@c.us`.
No realiza altas definitivas, no valida documentación ni integra correo; deriva por email.
No implementa IA generativa ni responde a mensajes anteriores al inicio.
Guarda mensajes en `data/conversations.jsonl` localmente; proteger permisos y backups.
El proceso debe mantenerse ejecutándose. Para producción, usar supervisor y configurar arranque WSL.
