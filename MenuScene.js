class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Load Legacy Fantasy assets for beautiful menu
        this.load.image('menu_forest', 'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Background/Background.png');
        this.load.spritesheet('menu_soldier', 'Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Soldier/Soldier/Soldier-Idle.png', { frameWidth: 100, frameHeight: 100 });
        this.load.image('menu_tree', 'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Trees/Green-Tree.png');
    }

    create() {
        // === FOREST BACKGROUND ===
        this.add.image(400, 300, 'menu_forest').setScale(1.5).setAlpha(0.7);

        // === DECORATIVE TREES ===
        this.add.image(100, 450, 'menu_tree').setScale(1.5).setAlpha(0.8).setDepth(-1);
        this.add.image(700, 430, 'menu_tree').setScale(1.3).setAlpha(0.7).setDepth(-1);

        // LIGHTER overlay for text readability
        const overlay = this.add.graphics();
        overlay.fillGradientStyle(0x2a2a3e, 0x2a2a3e, 0x1a1a2e, 0x1a1a2e, 0.4);
        overlay.fillRect(0, 0, 800, 600);

        // === ANIMATED CHARACTER PREVIEW ===
        const hero = this.add.sprite(650, 480, 'menu_soldier').setScale(3);
        this.anims.create({
            key: 'menu-hero-idle',
            frames: this.anims.generateFrameNumbers('menu_soldier', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
        hero.play('menu-hero-idle');

        // Floating particles
        this.createFloatingParticles();

        // === GAME TITLE ===
        const title = this.add.text(400, 120, 'BEAST SLAYER', {
            fontSize: '72px',
            fill: '#e74c3c',
            fontStyle: 'bold',
            stroke: '#8B0000',
            strokeThickness: 8,
            shadow: {
                offsetX: 6,
                offsetY: 6,
                color: '#000',
                blur: 12,
                fill: true
            }
        }).setOrigin(0.5);

        // Title animation
        this.tweens.add({
            targets: title,
            y: 115,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // === SUBTITLE ===
        const subtitle = this.add.text(400, 190, '⚔️ HUNT THE BEASTS OF THE FOREST ⚔️', {
            fontSize: '22px',
            fill: '#f1c40f',
            fontStyle: 'bold',
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#f1c40f',
                blur: 15,
                fill: true
            }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: subtitle,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // === HIGH SCORE ===
        const highScore = HighScore.get();
        if (highScore > 0) {
            this.add.text(400, 240, `🏆 BEST: ${highScore} 🏆`, {
                fontSize: '24px',
                fill: '#2ecc71',
                fontStyle: 'bold',
                stroke: '#27ae60',
                strokeThickness: 3
            }).setOrigin(0.5);
        }

        // === CONTROLS BOX ===
        const controlsBg = this.add.rectangle(300, 380, 500, 200, 0x000000, 0.6);
        controlsBg.setStrokeStyle(3, 0x3498db, 0.8);

        this.add.text(300, 300, '⚔️ HOW TO PLAY', {
            fontSize: '26px',
            fill: '#3498db',
            fontStyle: 'bold',
            stroke: '#2980b9',
            strokeThickness: 2
        }).setOrigin(0.5);

        const controls = [
            '🏃 WASD / Arrows - Move',
            '⬆️  Space - Jump',
            '⚔️  K - Attack Enemies',
            '⏸️  ESC - Pause Game'
        ];

        controls.forEach((control, index) => {
            this.add.text(300, 330 + (index * 35), control, {
                fontSize: '18px',
                fill: '#ecf0f1',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        });

        // === START BUTTON ===
        const startBtn = this.add.rectangle(300, 520, 400, 60, 0x2ecc71, 0.3);
        startBtn.setStrokeStyle(4, 0x2ecc71);

        const startText = this.add.text(300, 520, '▶️ PRESS SPACE TO BEGIN ◀️', {
            fontSize: '24px',
            fill: '#2ecc71',
            fontStyle: 'bold',
            stroke: '#27ae60',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: [startText, startBtn],
            scale: 1.08,
            alpha: 0.85,
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        // === FOOTER ===
        this.add.text(400, 570, 'Legacy Fantasy Edition • v2.0', {
            fontSize: '14px',
            fill: '#7f8c8d',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.add.text(10, 580, '🔊 M: Toggle Sound', {
            fontSize: '14px',
            fill: '#95a5a6'
        });

        // === INPUT ===
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    }

    createFloatingParticles() {
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const size = Phaser.Math.Between(2, 5);
            const color = Phaser.Math.RND.pick([0xf1c40f, 0x2ecc71, 0x3498db]);

            const particle = this.add.circle(x, y, size, color, 0.4);

            this.tweens.add({
                targets: particle,
                y: y - 150,
                x: x + Phaser.Math.Between(-20, 20),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 7000),
                repeat: -1,
                yoyo: false,
                onRepeat: () => {
                    particle.y = 600;
                    particle.x = Phaser.Math.Between(0, 800);
                    particle.alpha = 0.4;
                }
            });
        }
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            audioManager.playMenuSelect();
            this.scene.start('GameScene');
        }

        if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
            audioManager.toggleMute();
        }
    }
}