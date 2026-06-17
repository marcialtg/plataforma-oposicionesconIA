#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

echo "🚀 Iniciando Oposita - Asistente IA para opositores docentes"
echo ""

# Start backend
echo "📦 Iniciando backend en http://localhost:3001..."
cd "$(dirname "$0")/backend"
node src/index.js &
BACKEND_PID=$!

# Start frontend
echo "🎨 Iniciando frontend en http://localhost:5173..."
cd "$(dirname "$0")/frontend"
npx vite --host &
FRONTEND_PID=$!

echo ""
echo "✅ Aplicación iniciada:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
