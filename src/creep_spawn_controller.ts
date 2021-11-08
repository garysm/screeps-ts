import { CreepRank } from "utils/creep_types/creep_rank";
import { CreepRole } from "utils/creep_types/creep_role";
import { CreepTask } from "utils/creep_types/creep_task";

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
