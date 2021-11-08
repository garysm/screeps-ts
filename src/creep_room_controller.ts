// create creep controller class that takes a spawn controller and a creep task controller

import { CreepSpawnController } from "creep_spawn_controller";
import { CreepTaskController } from "creep_task_controller";

export class CreepRoomController {
    room: Room;
    spawnController: CreepSpawnController = new CreepSpawnController();
    taskController: CreepTaskController = new CreepTaskController();
    public initializaing: boolean = true;

    constructor(room: Room) {
        this.room = room;
        // TODO ensure that initialize only fires once
        this.run();
    }

    run(): void {
        console.log("running creep room controller");
    }

    private initialize(): void {
        console.log("initializing...");
        this.initializaing = false;
    }
}
