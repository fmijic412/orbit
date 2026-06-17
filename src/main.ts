import { Game } from "./game/Game";
import "./style.css";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const game = new Game(canvas);
game.start();
