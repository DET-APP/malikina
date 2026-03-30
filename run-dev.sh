#!/bin/bash

cd /Users/user/Desktop/projects/personnel-projects/malikina

echo "🚀 Starting Malikina API and Frontend..."
echo ""

# Start API
echo "📡 Starting API on port 5000..."
cd api && npm run dev > /tmp/api.log 2>&1 &
API_PID=$!
sleep 2

# Check API health
if curl -s http://localhost:5000/api/authors > /dev/null 2>&1; then
  echo "✅ API running (PID: $API_PID)"
else
  echo "❌ API failed to start"
fi

echo ""

# Start Frontend
echo "🎨 Starting Frontend..."
cd ..
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🎉 Application Ready!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📡 API:      http://localhost:5000/api"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "📝 Logs:"
echo "   API:      tail -f /tmp/api.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 To stop: kill $API_PID $FRONTEND_PID"
echo ""

# Keep script running
wait
