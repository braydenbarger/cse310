import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ConcurrentLinkedQueue;

public class SpaceShooter {

    private static final int WIDTH = 30;
    private static final int MAX_HEIGHT = 20;
    private static final int MIN_HEIGHT = 8;
    private static final int HUD_LINES = 6;
    private static int height = MAX_HEIGHT;
    private static final int TICK_MS = 50;
    private static final int START_LIVES = 3;
    private static final int MAX_BULLETS = 4;

    private static final char SHIP = 'A';
    private static final char ENEMY = 'V';
    private static final char BULLET = '|';
    private static final char EXPLOSION = '*';

    private static final String ESC = "\033[";
    private static final String CLEAR = ESC + "2J";
    private static final String HOME = ESC + "H";
    private static final String HIDE_CURSOR = ESC + "?25l";
    private static final String SHOW_CURSOR = ESC + "?25h";
    private static final String RESET = ESC + "0m";
    private static final String GREEN = ESC + "32m";
    private static final String RED = ESC + "31m";
    private static final String YELLOW = ESC + "33m";
    private static final String CYAN = ESC + "36m";

    private static class Entity {
        int x;
        int y;
        int ttl;

        Entity(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }

    private enum Key { LEFT, RIGHT, FIRE, PAUSE, QUIT, RESTART }

    private final ConcurrentLinkedQueue<Key> keys = new ConcurrentLinkedQueue<Key>();
    private final Random random = new Random();

    private final List<Entity> enemies = new ArrayList<Entity>();
    private final List<Entity> bullets = new ArrayList<Entity>();
    private final List<Entity> explosions = new ArrayList<Entity>();

    private int shipX;
    private int score;
    private int lives;
    private int tick;
    private boolean paused;
    private boolean gameOver;
    private boolean running = true;
    private int highScore;

    public static void main(String[] args) throws Exception {
        if (System.console() == null) {
            System.out.println("Please run this game directly in a terminal:");
            System.out.println("  javac SpaceShooter.java && java SpaceShooter");
            return;
        }
        new SpaceShooter().run();
    }

    private void run() throws Exception {
        fitToTerminal();
        enableRawMode();
        Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
            public void run() {
                restoreTerminal();
            }
        }));

        startInputThread();
        System.out.print(CLEAR + HIDE_CURSOR);
        resetGame();

        while (running) {
            long start = System.currentTimeMillis();

            handleInput();
            if (!paused && !gameOver) {
                update();
            }
            render();

            long elapsed = System.currentTimeMillis() - start;
            if (elapsed < TICK_MS) {
                Thread.sleep(TICK_MS - elapsed);
            }
        }

        System.out.print(CLEAR + HOME);
        System.out.println("Thanks for playing! Final score: " + score
                + "   High score: " + highScore);
        System.out.flush();
        System.exit(0);
    }

    private void resetGame() {
        enemies.clear();
        bullets.clear();
        explosions.clear();
        shipX = WIDTH / 2;
        score = 0;
        lives = START_LIVES;
        tick = 0;
        paused = false;
        gameOver = false;
    }

    private void handleInput() {
        Key key;
        while ((key = keys.poll()) != null) {
            switch (key) {
                case QUIT:
                    running = false;
                    return;
                case RESTART:
                    if (gameOver) {
                        resetGame();
                    }
                    break;
                case PAUSE:
                    if (!gameOver) {
                        paused = !paused;
                    }
                    break;
                case LEFT:
                    if (!paused && !gameOver && shipX > 0) {
                        shipX--;
                    }
                    break;
                case RIGHT:
                    if (!paused && !gameOver && shipX < WIDTH - 1) {
                        shipX++;
                    }
                    break;
                case FIRE:
                    if (!paused && !gameOver && bullets.size() < MAX_BULLETS) {
                        bullets.add(new Entity(shipX, height - 2));
                    }
                    break;
            }
        }
    }

    private void startInputThread() {
        Thread t = new Thread(new Runnable() {
            public void run() {
                InputStream in = System.in;
                try {
                    int c;
                    while ((c = in.read()) != -1) {
                        if (c == 27) {
                            int c2 = in.read();
                            if (c2 == '[') {
                                int c3 = in.read();
                                if (c3 == 'D') keys.add(Key.LEFT);
                                else if (c3 == 'C') keys.add(Key.RIGHT);
                                else if (c3 == 'A') keys.add(Key.FIRE);
                            }
                            continue;
                        }
                        switch (Character.toLowerCase((char) c)) {
                            case 'a': keys.add(Key.LEFT); break;
                            case 'd': keys.add(Key.RIGHT); break;
                            case 'w':
                            case ' ': keys.add(Key.FIRE); break;
                            case 'p': keys.add(Key.PAUSE); break;
                            case 'r': keys.add(Key.RESTART); break;
                            case 'q': keys.add(Key.QUIT); break;
                            default: break;
                        }
                    }
                } catch (IOException e) {
                    keys.add(Key.QUIT);
                }
            }
        });
        t.setDaemon(true);
        t.start();
    }

    private void update() {
        tick++;

        Iterator<Entity> bi = bullets.iterator();
        while (bi.hasNext()) {
            Entity b = bi.next();
            if (hitEnemyAt(b.x, b.y)) {
                bi.remove();
                continue;
            }
            b.y--;
            if (b.y < 0 || hitEnemyAt(b.x, b.y)) {
                bi.remove();
            }
        }

        int level = 1 + score / 100;
        int fallEvery = Math.max(3, 10 - level);
        if (tick % fallEvery == 0) {
            Iterator<Entity> ei = enemies.iterator();
            while (ei.hasNext()) {
                Entity e = ei.next();
                e.y++;
                if (e.y == height - 1 && e.x == shipX) {
                    ei.remove();
                    addExplosion(e.x, e.y);
                    loseLife();
                } else if (e.y >= height) {
                    ei.remove();
                    loseLife();
                }
            }
        }

        int spawnEvery = Math.max(6, 20 - level * 2);
        if (tick % spawnEvery == 0) {
            enemies.add(new Entity(random.nextInt(WIDTH), 0));
        }

        Iterator<Entity> xi = explosions.iterator();
        while (xi.hasNext()) {
            Entity x = xi.next();
            if (--x.ttl <= 0) {
                xi.remove();
            }
        }
    }

    private boolean hitEnemyAt(int x, int y) {
        Iterator<Entity> ei = enemies.iterator();
        while (ei.hasNext()) {
            Entity e = ei.next();
            if (e.x == x && e.y == y) {
                ei.remove();
                addExplosion(x, y);
                score += 10;
                return true;
            }
        }
        return false;
    }

    private void addExplosion(int x, int y) {
        Entity ex = new Entity(x, y);
        ex.ttl = 4;
        explosions.add(ex);
    }

    private void loseLife() {
        lives--;
        if (lives <= 0) {
            lives = 0;
            gameOver = true;
            highScore = Math.max(highScore, score);
        }
    }

    private void render() {
        String[][] grid = new String[height][WIDTH];
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < WIDTH; x++) {
                grid[y][x] = " ";
            }
        }

        for (Entity e : enemies) put(grid, e.x, e.y, RED + ENEMY + RESET);
        for (Entity b : bullets) put(grid, b.x, b.y, YELLOW + BULLET + RESET);
        for (Entity x : explosions) put(grid, x.x, x.y, YELLOW + EXPLOSION + RESET);
        if (!gameOver) put(grid, shipX, height - 1, GREEN + SHIP + RESET);

        StringBuilder sb = new StringBuilder();
        sb.append(HOME);
        sb.append(CYAN).append("  SPACE SHOOTER").append(RESET).append("\033[K\n");
        sb.append(String.format("  Score: %-5d  Lives: %-2s  Level: %d\033[K\n",
                score, hearts(), 1 + score / 100));

        String border = "+" + repeat('-', WIDTH) + "+";
        sb.append(border).append('\n');
        for (int y = 0; y < height; y++) {
            sb.append('|');
            for (int x = 0; x < WIDTH; x++) {
                sb.append(grid[y][x]);
            }
            sb.append("|\n");
        }
        sb.append(border).append('\n');

        if (gameOver) {
            sb.append(RED).append("  GAME OVER!").append(RESET)
              .append("  Score: ").append(score)
              .append("  Best: ").append(highScore).append("\033[K\n");
            sb.append("  Press R to play again or Q to quit.\033[K\n");
        } else if (paused) {
            sb.append(YELLOW).append("  PAUSED - press P to resume").append(RESET).append("\033[K\n");
            sb.append("\033[K\n");
        } else {
            sb.append("  A/D or arrows: move   SPACE/W: shoot\033[K\n");
            sb.append("  P: pause   Q: quit\033[K\n");
        }

        sb.setLength(sb.length() - 1);
        sb.append("\033[J");

        System.out.print(sb);
        System.out.flush();
    }

    private void put(String[][] grid, int x, int y, String s) {
        if (x >= 0 && x < WIDTH && y >= 0 && y < height) {
            grid[y][x] = s;
        }
    }

    private String hearts() {
        return repeat('*', lives);
    }

    private static String repeat(char c, int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) sb.append(c);
        return sb.toString();
    }

    private static void enableRawMode() {
        stty("-icanon -echo min 1");
    }

    private static void fitToTerminal() {
        try {
            String[] cmd = {"/bin/sh", "-c", "stty size < /dev/tty"};
            Process p = Runtime.getRuntime().exec(cmd);
            java.util.Scanner sc = new java.util.Scanner(p.getInputStream());
            if (sc.hasNextInt()) {
                int rows = sc.nextInt();
                height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, rows - HUD_LINES));
            }
            sc.close();
            p.waitFor();
        } catch (Exception e) {
        }
    }

    private static void restoreTerminal() {
        System.out.print(RESET + SHOW_CURSOR);
        System.out.flush();
        stty("sane");
    }

    private static void stty(String args) {
        try {
            String[] cmd = {"/bin/sh", "-c", "stty " + args + " < /dev/tty"};
            Runtime.getRuntime().exec(cmd).waitFor();
        } catch (Exception e) {
            System.err.println("Could not configure terminal: " + e.getMessage());
        }
    }
}
