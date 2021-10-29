import { indexOf } from "lodash";
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
    role: string;
    room: string;
    upgrading?: boolean;
    building?: boolean;
    harvesting?: boolean;
    refilling?: boolean;
    repairing?: boolean;
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
  let myCreeps = Game.creeps;

  const harvesters: Creep[] = _.filter(myCreeps, (creep) => creep.memory.role == "harvester");
  const builders: Creep[] = _.filter(myCreeps, (creep) => creep.memory.role == "builder");
  const repairCreeps: Creep[] = _.filter(myCreeps, (creep) => creep.memory.role == "repair");


  console.log(`Harvesters: ${harvesters.length}`);
  console.log(`Builders: ${builders.length}`);
  console.log(`Repair Creeps: ${repairCreeps.length}`);

  const spawn1 = Game.spawns["Spawn1"];

  // ensure that there are enough harvesters
  if (harvesters.length < 6) {
    spawnHarvesters(spawn1);
  } else if (repairCreeps.length < 2) {
    spawnRepairCreeps(spawn1);
  } else if (builders.length < 4) {
    spawnBuilders(spawn1);
  }

  // if (builders.length < 2) {
  //   spawnBuilders(spawn1);
  // }

  // if (repairCreeps.length < 2) {
  //   spawnRepairCreeps(spawn1);
  // }

  //run for each harvester
  for (const name in harvesters) {
    const creep = harvesters[name];
    runHarvester(creep);
  }

  //run for each builder
  for (const name in builders) {
    const creep = builders[name];
    runBuilder(creep);
  }

  //run for each repair creep
  for (const name in repairCreeps) {
    const creep = repairCreeps[name];
    runRepairCreep(creep);
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});

function spawnHarvesters(spawn1: StructureSpawn) {
  let name = 'Harvester' + Game.time;
  let body = [WORK, CARRY, MOVE];
  let memory = { role: 'harvester', room: spawn1.room.name, harvesting: true };

  let memoryData = { name, body, memory };

  spawn1.spawnCreep([WORK, WORK, CARRY, MOVE], `Harvester-${Game.time}`, memoryData);
}

// spawn builders
function spawnBuilders(spawn1: StructureSpawn) {
  let name = 'Builder' + Game.time;
  let body = [WORK, CARRY, MOVE];
  let memory = { role: 'builder', room: spawn1.room.name, harvesting: true };

  let memoryData = { name, body, memory };

  spawn1.spawnCreep([WORK, WORK, CARRY, CARRY, MOVE], `Builder-${Game.time}`, memoryData);
}

// spawn repair creeps
function spawnRepairCreeps(spawn1: StructureSpawn) {
  let name = 'Repair' + Game.time;
  let body = [WORK, CARRY, MOVE];
  let memory = { role: 'repair', room: spawn1.room.name, harvesting: true };

  let memoryData = { name, body, memory };

  spawn1.spawnCreep([WORK, WORK, CARRY, CARRY, MOVE], `Repair-${Game.time}`, memoryData);
}

function runHarvester(creep: Creep) {
  var refillTargets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_CONTAINER) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    },
  });
  var constructionTargets = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: (structure) => {
      return structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN;
    }
  });

  let availableTaskExists = (refillTargets.length > 0 || constructionTargets.length > 0 || creep.store[RESOURCE_ENERGY] == 0);

  if ((creep.memory.harvesting || availableTaskExists) && creep.store.getFreeCapacity() == 0) {
    creep.memory.harvesting = false;
    if (refillTargets.length > 0) {
      creep.memory.refilling = true;
    } else {
      if (constructionTargets.length > 0) {
        creep.memory.building = true;
      }
    }
  }

  if ((creep.memory.refilling || creep.memory.building) && creep.store[RESOURCE_ENERGY] == 0) {
    creep.memory.refilling = false;
    creep.memory.building = false;
    creep.memory.harvesting = true;
  }

  let hasTask = (creep.memory.harvesting || creep.memory.refilling || creep.memory.building || creep.memory.upgrading) ? true : false;

  if (hasTask) {
    if (creep.memory.harvesting) {
      var sources = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
      if (sources != null) {
        if (creep.harvest(sources) == ERR_NOT_IN_RANGE) {
          creep.say('⛏ harvest');

          creep.moveTo(sources, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    }

    else if (creep.memory.refilling) {
      if (refillTargets.length > 0) {
        creep.say('🔄 refill');
        if (creep.transfer(refillTargets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(refillTargets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
      } else {
        if (constructionTargets.length > 0 && creep.store[RESOURCE_ENERGY] > 0) {
          creep.memory.refilling = false;
          creep.memory.building = true;
        } else {
          rally(creep);
        }
      }
    }

    else if (creep.memory.building) {
      creep.say('🚧 build');
      if (constructionTargets.length) {
        if (creep.build(constructionTargets[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(constructionTargets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    }
  }
  else {
    rally(creep);
  }
}



// run builders
function runBuilder(creep: Creep) {

  var constructionTargets = creep.room.find(FIND_CONSTRUCTION_SITES, {
    filter: (structure) => {
      return structure.structureType == STRUCTURE_EXTENSION
        || structure.structureType == STRUCTURE_SPAWN
        || structure.structureType == STRUCTURE_TOWER
        || structure.structureType == STRUCTURE_ROAD
        || structure.structureType == STRUCTURE_WALL
        || structure.structureType == STRUCTURE_CONTAINER;

    }
  });

  var controllerCanUpgrade = creep.room.controller != null && creep.room.controller.my;

  let availableTaskExists = (constructionTargets.length > 0 || controllerCanUpgrade || creep.store[RESOURCE_ENERGY] == 0);

  // TODO make an init function to assign an initial task

  if ((creep.memory.harvesting || availableTaskExists) && creep.store.getFreeCapacity() == 0) {
    creep.memory.harvesting = false;
    if (constructionTargets.length > 0) {
      //print out the construction targets
      creep.memory.building = true;
    } else {
      creep.memory.building = false;
      if (controllerCanUpgrade) {
        creep.memory.upgrading = true;
      }
    }
  }

  if ((creep.memory.building || creep.memory.upgrading) && creep.store[RESOURCE_ENERGY] == 0) {
    creep.memory.building = false;
    creep.memory.upgrading = false;
    creep.memory.harvesting = true;
  }

  let hasTask = (creep.memory.harvesting || creep.memory.building || creep.memory.upgrading) ? true : false;

  if (hasTask) {
    if (creep.memory.harvesting) {
      creep.say('⛏ harvest');
      var sources = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
      if (sources != null) {
        if (creep.harvest(sources) == ERR_NOT_IN_RANGE) {
          creep.moveTo(sources, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    }
    else if (creep.memory.building) {
      creep.say('🚧 build');
      if (constructionTargets.length) {
        if (creep.build(constructionTargets[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(constructionTargets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    } else if (creep.memory.upgrading) {
      creep.say('⚡ upgrade');
      if (creep.upgradeController(creep.room.controller!) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    }
  }
  else {
    rally(creep);
  }
}

function runRepairCreep(creep: Creep) {
  var repairTargets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return structure.structureType == STRUCTURE_WALL
    }
  });

  let availableTaskExists = (repairTargets.length > 0 || creep.store[RESOURCE_ENERGY] == 0);

  if ((creep.memory.harvesting || availableTaskExists) && creep.store.getFreeCapacity() == 0) {
    creep.memory.harvesting = false;
    if (repairTargets.length > 0) {
      creep.memory.repairing = true;
    } else {
      creep.memory.repairing = false;
    }
  }

  if ((creep.memory.repairing) && creep.store[RESOURCE_ENERGY] == 0) {
    creep.memory.repairing = false;
    creep.memory.harvesting = true;
  }

  let hasTask = (creep.memory.harvesting || creep.memory.repairing) ? true : false;

  if (hasTask) {
    if (creep.memory.harvesting) {
      creep.say('⛏ harvest');
      var sources = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
      if (sources != null) {
        if (creep.harvest(sources) == ERR_NOT_IN_RANGE) {
          creep.moveTo(sources, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    }
    else if (creep.memory.repairing) {
      if (repairTargets.length > 0) {
        for (let i = 0; i < repairTargets.length; i++) {
          var wall = repairTargets[i] as StructureWall;
          if (wall.hits < 1000) {
            if (creep.repair(repairTargets[i]) == ERR_NOT_IN_RANGE) {
              creep.moveTo(repairTargets[i]);
            }
          }
        }
      }
    }
  }
}


function rally(creep: Creep) {
  creep.moveTo(Game.flags.Rally1, { visualizePathStyle: { stroke: '#ffffff' } });
}
