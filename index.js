let mode = "juju";
let triggeredBlocks = new Set();
let targetblocks = {};
let initialized = false;

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
const C0APacketAnimation = Java.type("net.minecraft.network.play.client.C0APacketAnimation");

let startTime = null;
let endTime = null;

register("renderOverlay", () => {
    if (startTime === null) return;

    let duration = ((Date.now() - startTime) / 1000).toFixed(2);

    Renderer.drawStringWithShadow(`I4 Timer: ${duration}s`, 450, 300);
});

register("command", (arg) => {
    if (!initialized) {
        ChatLib.chat("&c&l&1[&9ughi4&1]&7 Module not initialized. Please wait for world load.");
        return;
    }
    if (!arg) {
        ChatLib.chat("&cUsage: &l&1[&9ughi4&1]&7 <juju|term/toggle>");
        return;
    }
    arg = arg.toLowerCase();
    if (arg === "juju" || arg === "term") {
        mode = arg;
        ChatLib.chat(`&l&f[&9ughi4&f]&r Mode set to &e${mode}`);
    } else {
        ChatLib.chat("&cUsage: &l&1[&9ughi4&1]&7 <juju|term/toggle>");
    }
    if (arg === "toggle") {
        mode = null;
        targetblocks = {};
        ChatLib.chat("&l&1[&9ughi4&1]&c Disabled");
    }
}).setName("ughi4");

register("worldLoad", () => {
    initialized = true;
    startTime = null;
    endTime = null;
});

register("tick", () => {
    if (!initialized) return;
    if (!Player || !Client || !World) return;

    let x = Math.floor(Player.getX());
    let y = Math.floor(Player.getY());
    let z = Math.floor(Player.getZ());

    if (x !== 63 || y !== 127 || z !== 35) return;

    checkEmeralds();
});

const i4blocks = [
    [64,126,50],[64,128,50],[64,130,50],
    [66,126,50],[66,128,50],[66,130,50],
    [68,126,50],[68,128,50],[68,130,50]
];

const glasspanes = {
    1:[[65,126,50]],2:[[65,128,50]],3:[[65,130,50]],
    4:[[65,126,50]],5:[[65,128,50]],6:[[65,130,50]],
    7:[[67,126,50]],8:[[67,128,50]],9:[[67,130,50]]
};

function isEmerald(block) {
    if (!block || !block.type || !block.type.getRegistryName) return false;
    let name = block.type.getRegistryName().toLowerCase();
    return name.includes("emerald_block");
}

function rightClick() {
    const mc = Client.getMinecraft();
    if (!mc || !mc.field_71439_g) return;
    Client.sendPacket(new C08PacketPlayerBlockPlacement(mc.field_71439_g.func_71045_bC()));
    Client.sendPacket(new C0APacketAnimation());
}

function checkEmeralds() {
    if (!initialized) return;

    let activeBefore = Object.keys(targetblocks).length;

    i4blocks.forEach((coords, idx) => {
        let [x, y, z] = coords;
        let id = idx + 1;
        let block = World.getBlockAt(x, y, z);
        if (!block) return;

        if (isEmerald(block)) {
            if (!targetblocks[id]) targetblocks[id] = coords;
        } else {
            if (targetblocks[id]) delete targetblocks[id];
        }
    });

    let activeNow = Object.keys(targetblocks).length;

    if (activeNow > 0 && startTime === null) {
        startTime = Date.now();
    }

    Object.keys(targetblocks).forEach(id => {
        if (mode === "juju") {
            aimatthatho(targetblocks[id]);
            rightClick();
        } else if (mode === "term") {
            let panes = glasspanes[id] || [];
            if (panes.length > 0) {
                let closest = panes.reduce((a, b) => {
                    let da = distance3D(a, Player.getX(), Player.getY(), Player.getZ());
                    let db = distance3D(b, Player.getX(), Player.getY(), Player.getZ());
                    return da < db ? a : b;
                });
                aimatthatho(closest);
                rightClick();
            }
        }
    });

    if (activeBefore > 0 && activeNow === 0 && startTime !== null) {
        endTime = Date.now();
        let duration = ((endTime - startTime) / 1000).toFixed(2);
        ChatLib.chat(`&l&f[&9ughi4&f]&r completed i4 in &e${duration}s`);
        startTime = null;
        endTime = null;
    }
}

function distance3D([x, y, z], px, py, pz) {
    let dx = x - px, dy = y - py, dz = z - pz;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function aimatthatho(coords) {
    let [x, y, z] = coords;

    let px = Player.getX();
    let py = Player.getY() + 1.62;
    let pz = Player.getZ();

    let dx = x + 0.5 - px;
    let dy = y + 1 - py;
    let dz = z + 0.5 - pz;

    let distXZ = Math.sqrt(dx * dx + dz * dz);
    let yaw = Math.round(Math.atan2(-dx, dz) * 180 / Math.PI * 100) / 100;
    let pitch = Math.round(-Math.atan2(dy, distXZ) * 180 / Math.PI * 100) / 100;

    const mc = Client.getMinecraft();
    if (!mc || !mc.field_71439_g) return;

    Client.sendPacket(
        new C03PacketPlayer.C06PacketPlayerPosLook(px, Player.getY(), pz, yaw, pitch, false)
    );

    mc.field_71439_g.field_70177_z = yaw;
    mc.field_71439_g.field_70125_A = pitch;

    if (mc.func_147121_ag) mc.func_147121_ag();
}

