import { CreepRole, CreepRoomController, CreepTask } from "creep_room_controller";
import { ErrorMapper } from "utils/ErrorMapper";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory {
    role: CreepRole;
    currentTask: CreepTask,
    room: string;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {

  console.log(`Current game tick is ${Game.time}`);

  let myRooms = _.filter(Game.rooms, (r) => r.controller && r.controller.my);
  const spawn1Room = Game.spawns['Spawn1'].room;
  const spawn1EnergyCapacity = Game.rooms[spawn1Room.name].energyCapacityAvailable;
  const spawn1EnergyAvailable = Game.rooms[spawn1Room.name].energyAvailable;

  const containers: StructureContainer[] = spawn1Room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_CONTAINER)
    }
  });

  // calculate containers total energy capacity
  const containerCap = _.sum(containers, c => c.store.getCapacity(RESOURCE_ENERGY));

  // calculate containers total energy available
  const containerEnergyAvailable = _.sum(containers, c => c.store[RESOURCE_ENERGY]);

  console.log(`Spawn1 Energy Capacity: ${spawn1EnergyCapacity}`);
  console.log(`Spawn1 Energy Available: ${spawn1EnergyAvailable}`);
  console.log(`Container Energy Capacity: ${containerCap}`);
  console.log(`Container Energy Available: ${containerEnergyAvailable}`);

  let myCreeps = Game.creeps;

  const creepRoomController = new CreepRoomController(spawn1Room);

  // const harvesters: Creep[] = _.filter(myCreeps, (creep) => creep.memory.role == CreepRole.Harvester);
  // const builders: Creep[] = _.filter(myCreeps, (creep) => creep.memory.role == CreepRole.Builder);
  // const repairCreeps: Creep[] = _.filter(myCreeps, (creep) => creep.memory.role == CreepRole.Repair);


  // console.log(`Harvesters: ${harvesters.length}`);
  // console.log(`Builders: ${builders.length}`);
  // console.log(`Repair Creeps: ${repairCreeps.length}`);

  // if (harvesters.length < 8) {
  //   //Spawn basic harvesters if energy capacity is lower
  //   if (spawn1EnergyCapacity < 550 && spawn1EnergyAvailable < 550) {
  //     spawnHarvesters(spawn1);
  //   } else if (spawn1EnergyCapacity >= 550 && spawn1EnergyAvailable >= 550) {
  //     spawnAdvancedHarvesters(spawn1);
  //   }
  // }
  // else if (repairCreeps.length < 2) {
  //   spawnRepairCreeps(spawn1);
  // }
  // // Only spawn builders if available energy is more than 85% of the container capacity
  // else if (containerEnergyAvailable >= containerCap * 0.85) {
  //   spawnBuilders(spawn1);
  // }


  // for (const name in harvesters) {
  //   const creep = harvesters[name];
  //   runHarvester(creep);
  // }

  // for (const name in builders) {
  //   const creep = builders[name];
  //   runBuilder(creep);
  // }

  // for (const name in repairCreeps) {
  //   const creep = repairCreeps[name];
  //   runRepairCreep(creep);
  // }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
