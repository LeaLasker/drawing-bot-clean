export function drawFromJson(ctx, commands) {
  if (!ctx || !Array.isArray(commands)) return;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const cmd of commands) {
    if (!cmd.shape) continue;

    ctx.beginPath();
    ctx.lineWidth = cmd.lineWidth || 2;
    ctx.strokeStyle = cmd.color || "black";
    ctx.fillStyle = cmd.color || "black";

    switch (cmd.shape) {
      case "triangle":
        ctx.moveTo(cmd.x1, cmd.y1);
        ctx.lineTo(cmd.x2, cmd.y2);
        ctx.lineTo(cmd.x3, cmd.y3);
        ctx.closePath();
        ctx.stroke();
        break;

      case "circle":
        ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case "rect":
        ctx.strokeRect(cmd.x, cmd.y, cmd.width, cmd.height);
        break;

      case "line":
        ctx.moveTo(cmd.x1, cmd.y1);
        ctx.lineTo(cmd.x2, cmd.y2);
        ctx.stroke();
        break;

      case "text":
        ctx.font = cmd.font || "16px Arial";
        ctx.fillText(cmd.text, cmd.x, cmd.y);
        break;
    }
  }
}
