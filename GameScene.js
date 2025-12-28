class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // ===  PLAYER CHARACTER (Soldier) ===
        this.load.setPath('Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/');
        this.load.spritesheet('soldier-idle', 'Soldier/Soldier/Soldier-Idle.png', { frameWidth: 100, frameHeight: 100 });
        this.load.spritesheet('soldier-walk', 'Soldier/Soldier/Soldier-Walk.png', { frameWidth: 100, frameHeight: 100 });
        this.load.spritesheet('soldier-attack', 'Soldier/Soldier/Soldier-Attack01.png', { frameWidth: 100, frameHeight: 100 });

        // === LEGACY FANTASY ASSETS ===
        this.load.setPath('');

        // Background - High Forest
        this.load.image('forest_bg', 'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Background/Background.png');

        // Ground Tileset from Debug Map
        this.load.spritesheet('legacy_tiles',
            'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Assets/Tiles.png',
            { frameWidth: 16, frameHeight: 16 });

        // Trees for decoration
        this.load.image('green_tree', 'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Trees/Green-Tree.png');
        this.load.image('golden_tree', 'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Trees/Golden-Tree.png');
        this.load.image('red_tree', 'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Trees/Red-Tree.png');

        // Props
        this.load.image('rocks', 'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Assets/Props-Rocks.png');

        // NEW ENEMIES - Boar
        this.load.spritesheet('boar-walk',
            'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Mob/Boar/Walk/Walk-Base-Sheet.png',
            { frameWidth: 48, frameHeight: 32 });
        this.load.spritesheet('boar-run',
            'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Mob/Boar/Run/Run-Sheet.png',
            { frameWidth: 48, frameHeight: 32 });
        this.load.spritesheet('boar-hit',
            'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Mob/Boar/Hit-Vanish/Hit-Sheet.png',
            { frameWidth: 48, frameHeight: 32 });

        // NEW ENEMIES - Flying Bee  
        this.load.spritesheet('bee-fly',
            'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Mob/Small Bee/Fly/Fly-Sheet.png',
            { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('bee-attack',
            'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Mob/Small Bee/Attack/Attack-Sheet.png',
            { frameWidth: 32, frameHeight: 32 });


        // === GOAL (Hive replaces shop) ===
        this.load.image('goal', 'Legacy-Fantasy - High Forest 2.0/Legacy-Fantasy - High Forest 2.3/Assets/Hive.png');

        // === EFFECTS ===
        this.load.setPath('');
        const swordGraphics = this.add.graphics();
        swordGraphics.lineStyle(4, 0xffffff);
        swordGraphics.beginPath();
        swordGraphics.arc(16, 16, 24, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45), false);
        swordGraphics.strokePath();
        swordGraphics.generateTexture('slash', 32, 32);
        swordGraphics.destroy();
    }

    create() {
        this.level = this.level || 1;
        this.score = this.score || 0;
        this.gameActive = true;
        this.isPaused = false;
        this.enemiesKilled = 0;

        // Combo system
        this.combo = 0;
        this.comboTimer = null;
        this.maxCombo = 0;

        // World Bounds (4x Screen Width) - 800x600
        this.physics.world.setBounds(0, 0, 3200, 600);
        this.cameras.main.setBounds(0, 0, 3200, 600);

        this.createAnimations();
        this.createLevel();
        this.createPlayer();
        this.setupInputs();
        this.setupUI();

        // Camera Follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Groups
        this.enemies = this.physics.add.group();
        this.attacks = this.physics.add.group();

        this.spawnEnemies(this.level * 4 + 5);

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.enemies);

        this.physics.add.overlap(this.attacks, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

        // Initialize audio on first interaction
        audioManager.init();

        // Damage numbers group
        this.damageTexts = this.add.group();
    }

    createAnimations() {
        // PLAYER animations
        this.anims.create({ key: 'player-idle', frames: this.anims.generateFrameNumbers('soldier-idle', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'player-walk', frames: this.anims.generateFrameNumbers('soldier-walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'player-attack', frames: this.anims.generateFrameNumbers('soldier-attack', { start: 0, end: 5 }), frameRate: 15, repeat: 0 });

        // NEW: Boar animations
        this.anims.create({ key: 'boar-walk', frames: this.anims.generateFrameNumbers('boar-walk', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'boar-run', frames: this.anims.generateFrameNumbers('boar-run', { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'boar-hit', frames: this.anims.generateFrameNumbers('boar-hit', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });

        // NEW: Bee animations (flying enemy!)
        this.anims.create({ key: 'bee-fly', frames: this.anims.generateFrameNumbers('bee-fly', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'bee-attack', frames: this.anims.generateFrameNumbers('bee-attack', { start: 0, end: 3 }), frameRate: 12, repeat: 0 });

        // Shop animation removed (sprite deleted)
    }

    createLevel() {
        // === LEGACY FANTASY FOREST BACKGROUND ===
        this.add.image(1600, 300, 'forest_bg')
            .setScrollFactor(0.2)
            .setScale(3)
            .setDepth(-10);

        this.platforms = this.physics.add.staticGroup();
        this.decorations = this.add.group();

        // === GROUND ===
        const groundY = 480;  // Original position for 800x600
        const tileSize = 48;

        // Ground platform
        const ground = this.add.rectangle(1600, groundY, 3200, 50, 0x4a3424);
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);

        // Top layer - varied Legacy Fantasy tiles (VISUAL ONLY - no collision)
        for (let x = 0; x < 3200; x += tileSize) {
            const tile = this.add.sprite(x + 24, groundY, 'legacy_tiles');
            tile.setFrame(Phaser.Math.Between(0, 5)); // Grass/dirt frames
            tile.setScale(3);
            tile.setDepth(1); // Above ground rectangle
        }

        // === TREE DECORATIONS (positioned to hide roots) ===
        const treeTypes = ['green_tree', 'golden_tree', 'red_tree'];
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(300, 2900);
            const treeType = Phaser.Utils.Array.GetRandom(treeTypes);
            this.add.image(x, groundY - 80, treeType)
                .setScale(2)
                .setDepth(-5)
                .setScrollFactor(0.8);
        }

        // === GOAL HIVE (much smaller!) ===
        this.goal = this.physics.add.sprite(3100, groundY - 60, 'goal');
        this.goal.setScale(0.5);  // SMALLER! Was 1.5
        // Hive is static image, no animation
        this.goal.body.setAllowGravity(false);
        this.goal.body.setImmovable(true);
        this.goal.body.setSize(60, 60);  // Adjusted for smaller scale
    }

    createPlatform(startX, startY, width) {
        // Add left slope if space permits
        if (width >= 3) {
            const leftSlope = this.platforms.create(startX, startY, 'slope_i1_0');
            leftSlope.setScale(2);
            leftSlope.refreshBody();

            // Middle blocks with PisoB
            for (let i = 1; i < width - 1; i++) {
                const block = this.platforms.create(startX + (i * 32), startY, 'floor_piso_b');
                block.setFrame(Math.floor(Math.random() * 20)); // Random frame
                block.setScale(2);
                block.refreshBody();
            }

            // Right slope
            const rightSlope = this.platforms.create(startX + ((width - 1) * 32), startY, 'slope_d1_0');
            rightSlope.setScale(2);
            rightSlope.refreshBody();
        } else {
            // Small platforms without slopes
            for (let i = 0; i < width; i++) {
                const block = this.platforms.create(startX + (i * 32), startY, 'floor_piso_b');
                block.setFrame(Math.floor(Math.random() * 20));
                block.setScale(2);
                block.refreshBody();
            }
        }
    }

    createPlayer() {
        // Spawn at correct Y for 800x600
        this.player = this.physics.add.sprite(100, 380, 'soldier-idle');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(2.5);
        this.player.setDepth(10);

        // Custom smaller collision box (40x95 instead of 100x100)
        this.player.body.setSize(40, 95);
        this.player.body.setOffset(30, 5);

        this.player.hp = 100 + (this.level * 10);
        this.player.maxHp = this.player.hp;
        this.player.damage = 10 + (this.level * 5);
        this.player.speed = 250;
        this.player.jumpPower = -500;
        this.player.isAttacking = false;

        this.player.play('player-idle');
    }

    setupInputs() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            k: Phaser.Input.Keyboard.KeyCodes.K
        });
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    spawnEnemies(count) {
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(500, 3000);
            const enemyType = Math.random();

            if (enemyType < 0.7) {
                // === BOAR (70% - Ground enemy) ===
                const boar = this.enemies.create(x, 380, 'boar-walk');
                boar.setCollideWorldBounds(true);
                boar.setScale(2.5);
                boar.setDepth(10);

                // Smaller collision box for boar
                boar.body.setSize(40, 25);
                boar.body.setOffset(4, 5);

                boar.hp = 35 + (this.level * 6);
                boar.speed = 70;
                boar.enemyType = 'boar';
                boar.play('boar-walk');
                boar.moveDir = Phaser.Math.RND.sign();
            } else {
                // === BEE (30% - Flying enemy!) ===
                const bee = this.enemies.create(x, Phaser.Math.Between(300, 450), 'bee-fly');  // Higher range for HD
                bee.setCollideWorldBounds(true);
                bee.setScale(2);
                bee.setDepth(10); // Render in front of tiles  
                bee.body.setAllowGravity(false); // FLIES!
                bee.body.setSize(28, 28);
                bee.body.setOffset(2, 2);
                bee.hp = 20 + (this.level * 3);
                bee.speed = 100;
                bee.enemyType = 'bee';
                bee.play('bee-fly');
                bee.moveDir = Phaser.Math.RND.sign();
                bee.hoverOffset = 0;
            }
        }

        // === BOSS ENEMY (1 per level!) ===
        const bossX = Phaser.Math.Between(1500, 2500);
        const boss = this.enemies.create(bossX, 380, 'boar-run');
        boss.setCollideWorldBounds(true);
        boss.setScale(4);  // HUGE!
        boss.setDepth(10);
        boss.setTint(0xff0000);  // RED

        boss.body.setSize(50, 35);
        boss.body.setOffset(4, 5);

        // Boss HP doubles each level: 200, 400, 800, 1600...
        boss.hp = 200 * Math.pow(2, this.level - 1);
        boss.maxHp = boss.hp;
        boss.speed = 50;
        boss.enemyType = 'boss';
        boss.isBoss = true;
        boss.play('boar-run');
        boss.moveDir = Phaser.Math.RND.sign();
    }

    update() {
        // Pause toggle
        if (Phaser.Input.Keyboard.JustDown(this.escKey) && this.gameActive) {
            this.togglePause();
            return;
        }

        if (!this.gameActive) {
            if (Phaser.Input.Keyboard.JustDown(this.rKey)) this.scene.restart();
            return;
        }

        if (this.isPaused) return;

        // Legacy Fantasy uses static background - no parallax scrolling needed

        this.handlePlayerMovement();
        this.handleCombat();
        this.updateEnemies();
        this.updateUI();

        if (this.player.y > 600) {  // Fall-off detection
            this.player.hp = 0;
            this.gameOver();
        }
    }

    handlePlayerMovement() {
        if (this.player.isAttacking) return;

        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;
        const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.space);

        if (left) {
            this.player.setVelocityX(-this.player.speed);
            this.player.setFlipX(true);
            this.player.play('player-walk', true);
        } else if (right) {
            this.player.setVelocityX(this.player.speed);
            this.player.setFlipX(false);
            this.player.play('player-walk', true);
        } else {
            this.player.setVelocityX(0);
            this.player.play('player-idle', true);
        }

        // Improved jump detection: check both touching and blocked
        const onGround = this.player.body.touching.down || this.player.body.blocked.down;

        if (jump && onGround) {
            this.player.setVelocityY(this.player.jumpPower);
            audioManager.playJump();
        }
    }

    handleCombat() {
        if (Phaser.Input.Keyboard.JustDown(this.wasd.k) && !this.player.isAttacking) {
            this.player.isAttacking = true;
            this.player.setVelocityX(0);
            this.player.play('player-attack');

            const offset = 80;  // INCREASED from 40 - longer reach!
            const rangeX = this.player.flipX ? -offset : offset;

            const attack = this.attacks.create(this.player.x + rangeX, this.player.y, 'slash');
            attack.body.setAllowGravity(false);
            attack.body.setSize(60, 60);  // Bigger hitbox!
            attack.setVisible(false);
            attack.lifespan = 300;

            audioManager.playAttack();

            this.player.on('animationcomplete', () => {
                this.player.isAttacking = false;
                this.player.play('player-idle');
                attack.destroy();
            });
        }
    }

    hitPlayer(player, enemy) {
        if (!enemy.active) return;

        // Check if player is ABOVE the enemy (stomping!)
        const playerBottom = player.y;
        const enemyTop = enemy.y;

        if (player.body.velocity.y > 0 && playerBottom < enemyTop - 10) {
            // STOMP! Damage enemy from above
            enemy.hp -= 50;
            player.setVelocityY(-300);  // Bounce!

            audioManager.playEnemyHit();
            this.showDamageNumber(enemy.x, enemy.y - 40, 50, '#ffaa00');
            this.createHitParticles(enemy.x, enemy.y, 0xffaa00);

            if (enemy.hp <= 0) {
                enemy.destroy();
                this.score += 150;
                this.enemiesKilled++;
                audioManager.playDeath();
                this.createDeathParticles(enemy.x, enemy.y);
            }
        } else {
            // Side hit - player takes damage
            if (this.time.now - (this.lastHit || 0) < 1000) return;
            this.lastHit = this.time.now;

            player.hp -= 10;
            player.setTint(0xff0000);
            this.time.delayedCall(200, () => player.clearTint());

            const dir = player.x < enemy.x ? -1 : 1;
            player.setVelocity(dir * 300, -200);

            audioManager.playHurt();
            this.shakeCamera(3, 200);

            if (player.hp <= 0) {
                this.gameOver();
            }
        }
    }

    updateEnemies() {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            if (enemy.enemyType === 'boar') {
                // BOAR - Ground movement
                if (enemy.body.touching.down || enemy.body.blocked.down) {
                    enemy.setVelocityX(enemy.speed * enemy.moveDir);
                    enemy.setFlipX(enemy.moveDir < 0);

                    if (enemy.body.blocked.left || enemy.body.blocked.right) {
                        enemy.moveDir *= -1;
                    }
                    if (Math.random() < 0.01) enemy.moveDir *= -1;
                }
            } else if (enemy.enemyType === 'bee') {
                // BEE - Flying movement (sine wave hover)
                enemy.hoverOffset += 0.05;
                const hoverY = Math.sin(enemy.hoverOffset) * 20;

                enemy.setVelocityX(enemy.speed * enemy.moveDir);
                enemy.setVelocityY(hoverY);
                enemy.setFlipX(enemy.moveDir > 0);

                if (enemy.body.blocked.left || enemy.body.blocked.right) {
                    enemy.moveDir *= -1;
                }
                if (Math.random() < 0.01) enemy.moveDir *= -1;
            } else if (enemy.enemyType === 'boss') {
                // BOSS - Aggressive ground movement
                if (enemy.body.touching.down || enemy.body.blocked.down) {
                    enemy.setVelocityX(enemy.speed * enemy.moveDir);
                    enemy.setFlipX(enemy.moveDir < 0);

                    if (enemy.body.blocked.left || enemy.body.blocked.right) {
                        enemy.moveDir *= -1;
                    }
                }
            }
        });
    }

    hitEnemy(attack, enemy) {
        if (!enemy.active) return;

        // Combo system
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        if (this.comboTimer) this.comboTimer.remove();
        this.comboTimer = this.time.delayedCall(2000, () => { this.combo = 0; });

        // Base damage with combo bonus
        let damage = this.player.damage + (this.combo > 1 ? Math.floor(this.combo * 0.5) : 0);

        // BOSS DAMAGE REDUCTION - takes only 50%!
        if (enemy.isBoss && enemy.damageReduction) {
            damage = Math.floor(damage * enemy.damageReduction);
        }

        enemy.hp -= damage;

        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => enemy.clearTint());

        const dir = this.player.x < enemy.x ? 1 : -1;
        enemy.setVelocity(dir * 200, -200);

        audioManager.playEnemyHit();

        // Combo color: yellow for 3+ combo
        const color = this.combo > 3 ? '#ffff00' : '#ff6b6b';
        this.showDamageNumber(enemy.x, enemy.y - 40, damage, color);

        // Show combo
        if (this.combo > 1) {
            const comboText = this.add.text(this.player.x, this.player.y - 60, `${this.combo}x COMBO!`, {
                fontSize: '20px',
                fill: '#ffff00',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(1000);

            this.tweens.add({
                targets: comboText,
                y: this.player.y - 90,
                alpha: 0,
                scale: 1.5,
                duration: 800,
                onComplete: () => comboText.destroy()
            });
        }

        this.createHitParticles(enemy.x, enemy.y, 0xff0000);
        this.shakeCamera(2, 100);

        if (enemy.hp <= 0) {
            enemy.destroy();
            const comboBonus = this.combo > 1 ? (this.combo * 50) : 0;
            this.score += 100 + comboBonus;
            this.enemiesKilled++;
            audioManager.playDeath();
            this.createDeathParticles(enemy.x, enemy.y);
        }
    }

    hitPlayer(player, enemy) {
        if (!enemy.active) return;
        if (player.alpha === 1) {
            player.hp -= 10;
            player.setTint(0xff0000);
            player.alpha = 0.5;
            player.setVelocity(0, -300);

            audioManager.playHit();
            this.showDamageNumber(player.x, player.y - 40, 10, '#ff0000');
            this.shakeCamera(4, 200);

            // Flashing effect for invincibility
            const flashTween = this.tweens.add({
                targets: player,
                alpha: 0.3,
                duration: 100,
                yoyo: true,
                repeat: 9
            });

            this.time.delayedCall(1000, () => {
                if (player.active) {
                    flashTween.stop();
                    player.clearTint();
                    player.alpha = 1;
                }
            });

            if (player.hp <= 0) this.gameOver();
        }
    }

    reachGoal(player, goal) {
        if (this.enemies.countActive() > 0) {
            this.statusText.setText('Defeat all enemies!');
            return;
        }

        audioManager.playLevelComplete();
        this.createVictoryParticles(goal.x, goal.y);

        // Level transition
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0).setScrollFactor(0).setDepth(1000);
        const levelText = this.add.text(400, 300, `LEVEL ${this.level + 1}`, {
            fontSize: '48px',
            fill: '#2ecc71',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setAlpha(0);

        this.tweens.add({
            targets: overlay,
            alpha: 0.8,
            duration: 500
        });

        this.tweens.add({
            targets: levelText,
            alpha: 1,
            scale: 1.2,
            duration: 500,
            onComplete: () => {
                this.time.delayedCall(1000, () => {
                    this.level++;

                    // MAX 10 LEVELS!
                    if (this.level > 10) {
                        this.statusText.setText('🎉 YOU WIN! ALL 10 LEVELS COMPLETE! 🎉');
                        this.time.delayedCall(3000, () => {
                            this.level = 1;
                            this.score = 0;
                            this.scene.restart();
                        });
                    } else {
                        this.score += 500;
                        this.scene.restart();
                    }
                });
            }
        });
    }

    setupUI() {
        this.add.rectangle(400, 30, 800, 60, 0x000000, 0.7).setScrollFactor(0).setDepth(100);

        // Health bar
        this.add.text(20, 15, 'HP:', { fontSize: '18px', fill: '#fff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(101);
        this.hpBarBg = this.add.rectangle(80, 24, 150, 20, 0x555555).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
        this.hpBar = this.add.rectangle(80, 24, 150, 20, 0x2ecc71).setOrigin(0, 0.5).setScrollFactor(0).setDepth(102);
        this.hpText = this.add.text(240, 15, '100/100', { fontSize: '16px', fill: '#fff' }).setScrollFactor(0).setDepth(101);

        this.scoreText = this.add.text(340, 15, 'Score: 0', { fontSize: '18px', fill: '#f1c40f' }).setScrollFactor(0).setDepth(101);
        this.levelText = this.add.text(550, 15, 'Level: 1', { fontSize: '18px', fill: '#3498db' }).setScrollFactor(0).setDepth(101);
        this.statusText = this.add.text(400, 50, '', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    }

    updateUI() {
        // Update health bar
        const hpPercent = this.player.hp / this.player.maxHp;
        const targetWidth = 150 * hpPercent;

        // Smooth health bar transition
        this.tweens.add({
            targets: this.hpBar,
            width: targetWidth,
            duration: 200,
            ease: 'Power2'
        });

        // Color based on health
        if (hpPercent > 0.6) {
            this.hpBar.setFillStyle(0x2ecc71); // Green
        } else if (hpPercent > 0.3) {
            this.hpBar.setFillStyle(0xf1c40f); // Yellow
        } else {
            this.hpBar.setFillStyle(0xe74c3c); // Red
        }

        this.hpText.setText(`${this.player.hp}/${this.player.maxHp}`);
        this.scoreText.setText(`Score: ${this.score}`);
        this.levelText.setText(`Level: ${this.level}`);

        if (this.enemies.countActive() === 0) {
            this.statusText.setText('AREA CLEAR! Go to the SHOP!');
            this.goal.setTint(0x00ff00);
        } else {
            this.statusText.setText(`Enemies: ${this.enemies.countActive()}`);
            this.goal.clearTint();
        }
    }

    gameOver() {
        this.gameActive = false;
        this.physics.pause();
        this.player.setTint(0x555555);

        audioManager.playGameOver();

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setScrollFactor(0).setDepth(1000);
        this.add.text(400, 200, 'GAME OVER', { fontSize: '64px', fill: '#c0392b', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        // Stats
        this.add.text(400, 280, `Final Score: ${this.score}`, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
        this.add.text(400, 330, `Level Reached: ${this.level}`, { fontSize: '24px', fill: '#ecf0f1' }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
        this.add.text(400, 360, `Enemies Defeated: ${this.enemiesKilled}`, { fontSize: '24px', fill: '#ecf0f1' }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        // Check high score
        const isHighScore = HighScore.set(this.score);
        if (isHighScore) {
            this.add.text(400, 410, '🏆 NEW HIGH SCORE! 🏆', { fontSize: '28px', fill: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
        } else {
            const highScore = HighScore.get();
            this.add.text(400, 410, `High Score: ${highScore}`, { fontSize: '20px', fill: '#95a5a6' }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
        }

        this.add.text(400, 500, 'Press R to Restart', { fontSize: '24px', fill: '#2ecc71' }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
        this.add.text(400, 540, 'Press ESC for Main Menu', { fontSize: '20px', fill: '#ecf0f1' }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        this.score = 0;
        this.level = 1;
        this.enemiesKilled = 0;
    }

    // === POLISH FUNCTIONS ===

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            audioManager.playPause();

            // Pause overlay
            this.pauseOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7).setScrollFactor(0).setDepth(2000);

            this.pauseTitle = this.add.text(400, 200, 'PAUSED', { fontSize: '64px', fill: '#3498db', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

            this.pauseResume = this.add.text(400, 300, '▶ Resume (ESC)', { fontSize: '28px', fill: '#2ecc71' }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
            this.pauseRestart = this.add.text(400, 360, '↻ Restart (R)', { fontSize: '24px', fill: '#f1c40f' }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
            this.pauseMenu = this.add.text(400, 410, '🏠 Main Menu (M)', { fontSize: '24px', fill: '#e74c3c' }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

            // Handle pause menu inputs
            if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.scene.restart();
            }
        } else {
            this.physics.resume();
            this.pauseOverlay?.destroy();
            this.pauseTitle?.destroy();
            this.pauseResume?.destroy();
            this.pauseRestart?.destroy();
            this.pauseMenu?.destroy();
        }
    }

    shakeCamera(intensity = 5, duration = 300) {
        this.cameras.main.shake(duration, intensity / 1000);
    }

    showDamageNumber(x, y, damage, color = '#ffffff') {
        const damageText = this.add.text(x, y, `-${damage}`, {
            fontSize: '24px',
            fill: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(999);

        this.tweens.add({
            targets: damageText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }

    createHitParticles(x, y, color = 0xffffff) {
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(x, y, 3, color).setDepth(500);
            const angle = (Math.PI * 2 / 8) * i;
            const speed = Phaser.Math.Between(50, 150);

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    createDeathParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(x, y, Phaser.Math.Between(2, 5), 0xff0000).setDepth(500);
            const angle = Math.random() * Math.PI * 2;
            const speed = Phaser.Math.Between(100, 250);

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed - 100,
                alpha: 0,
                duration: 800,
                ease: 'Cubic.out',
                onComplete: () => particle.destroy()
            });
        }
    }

    createVictoryParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = this.add.circle(
                    x + Phaser.Math.Between(-50, 50),
                    y + Phaser.Math.Between(-50, 50),
                    4,
                    Phaser.Math.Between(0, 1) ? 0xf1c40f : 0x2ecc71
                ).setDepth(500);

                this.tweens.add({
                    targets: particle,
                    y: y - 150,
                    alpha: 0,
                    scale: 2,
                    duration: 1000,
                    ease: 'Power2',
                    onComplete: () => particle.destroy()
                });
            }, i * 50);
        }
    }
}
``