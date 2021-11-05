// create creep controller class that takes a spawn controller and a creep task controller

import { CreepSpawnController } from "creep_spawn_controller";
import { CreepTaskController } from "creep_task_controller";

export enum CreepRank {
    Basic,
    Advanced,
}

export enum CreepRole {
    Harvester,
    Builder,
    Repair
}

export enum CreepTask {
    Initialize,
    Idle,
    Harvest,
    Build,
    Upgrade,
    Repair,
    Refill,
    Refuel,
    Rally,
}


export class CreepRoomController {
    room: Room;
    spawnController: CreepSpawnController = new CreepSpawnController();
    taskController: CreepTaskController = new CreepTaskController();
    private initializaing: boolean = true;

    constructor(room: Room) {
        this.room = room;
        // TODO ensure that initialize only fires once
        this.initialize();
    }

    // get the first spawn of this room
    getFirstSpawn(): StructureSpawn | null {
        return this.room.find(FIND_MY_SPAWNS)[0];
    }

    private initialize(): void {
        console.log("initializing creep room controller");
        this.initializaing = false;
    }
}
