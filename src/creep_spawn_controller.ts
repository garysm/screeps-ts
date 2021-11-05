import { CreepRank, CreepRole, CreepTask } from "creep_room_controller";

export class CreepSpawnController {
    public static spawnCreep(spawn1: StructureSpawn, initialRole: CreepRole, creepRank: CreepRank) {
        if (spawn1.spawning) {
            return;
        }

        const creepName = + creepRank.toString() + initialRole.toString();

        let name: string = creepName + Game.time;
        let body: BodyPartConstant[] = [WORK, WORK, CARRY, MOVE];
        if(creepRank == CreepRank.Advanced) {
        body = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE];
        }
        let memory = { role: initialRole, room: spawn1.room.name, currentTask: CreepTask.Initialize };

        spawn1.spawnCreep(body, name, { memory: memory });
    }
}
