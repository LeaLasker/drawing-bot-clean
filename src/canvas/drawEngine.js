function normalizeCommand(cmd) {
    if (cmd.action === "draw_circle" && Array.isArray(cmd.position)) {
        return {
            shape: "circle",
            x: cmd.position[0],
            y: cmd.position[1],
            radius: cmd.radius || 30
        };
    }

    if (cmd.action === "draw_line" && Array.isArray(cmd.start) && Array.isArray(cmd.end)) {
        return {
            shape: "line",
            x1: cmd.start[0],
            y1: cmd.start[1],
            x2: cmd.end[0],
            y2: cmd.end[1]
        };
    }

    // אם זה כבר פקודה תקינה – מחזירים כמו שהיא
    return cmd;
}

export function drawFromJson(ctx, commands) {

    if (!ctx || !Array.isArray(commands)) return;

    commands = commands.map(normalizeCommand);


    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // ננקה קודם

    for (const cmd of commands) {
        if (!cmd.shape) {
            console.warn("Missing 'shape' in command:", cmd);
            continue;
        }

        switch (cmd.shape) {
            case "triangle":
                if (cmd.x1 != null && cmd.y1 != null && cmd.x2 != null && cmd.y2 != null && cmd.x3 != null && cmd.y3 != null) {
                    ctx.beginPath();
                    ctx.moveTo(cmd.x1, cmd.y1);
                    ctx.lineTo(cmd.x2, cmd.y2);
                    ctx.lineTo(cmd.x3, cmd.y3);
                    ctx.closePath();
                    ctx.strokeStyle = cmd.color || "black";
                    ctx.stroke();
                } else {
                    console.warn("Invalid triangle command:", cmd);
                }
                break;

            case "circle":
                if (cmd.x != null && cmd.y != null && cmd.radius != null) {
                    ctx.beginPath();
                    ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = cmd.color || "black";
                    ctx.stroke();
                } else {
                    console.warn("Invalid circle command:", cmd);
                }
                break;

            case "rect":
                if (cmd.x != null && cmd.y != null && cmd.width != null && cmd.height != null) {
                    ctx.beginPath();
                    ctx.rect(cmd.x, cmd.y, cmd.width, cmd.height);
                    ctx.strokeStyle = cmd.color || "black";
                    ctx.stroke();
                } else {
                    console.warn("Invalid rect command:", cmd);
                }
                break;

            case "line":
                if (cmd.x1 != null && cmd.y1 != null && cmd.x2 != null && cmd.y2 != null) {
                    ctx.beginPath();
                    ctx.moveTo(cmd.x1, cmd.y1);
                    ctx.lineTo(cmd.x2, cmd.y2);
                    ctx.strokeStyle = cmd.color || "black";
                    ctx.stroke();
                } else {
                    console.warn("Invalid line command:", cmd);
                }
                break;

            case "text":
                if (cmd.text && cmd.x != null && cmd.y != null) {
                    ctx.font = cmd.font || "20px Arial";
                    ctx.fillText(cmd.text, cmd.x, cmd.y);
                } else {
                    console.warn("Invalid text command:", cmd);
                }
                break;

            default:
                console.warn("Unknown shape:", cmd.shape);
        }
    }
}
