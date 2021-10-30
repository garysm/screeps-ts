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
    refueling?: boolean;
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

  // TODO write initilization code for colony

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

  const harvesters: Creep[] = _.filter(myCreeps, (creep) => creep.memory.role == "harvester");
  const builders: Creep[] = _.filter(myCreeps, (creep) => creep.memory.role == "builder");
  const repairCreeps: Creep[] = _.filter(myCreeps, (creep) => creep.memory.role == "repair");


  console.log(`Harvesters: ${harvesters.length}`);
  console.log(`Builders: ${builders.length}`);
  console.log(`Repair Creeps: ${repairCreeps.length}`);

  const spawn1 = Game.spawns["Spawn1"];

  if (harvesters.length < 8) {
    //Spawn basic harvesters if energy capacity is lower
    if (spawn1EnergyCapacity < 550 && spawn1EnergyAvailable < 550) {
      spawnHarvesters(spawn1);
    } else if (spawn1EnergyCapacity >= 550 && spawn1EnergyAvailable >= 550) {
      spawnAdvancedHarvesters(spawn1);
    }
  }
  else if (repairCreeps.length < 2) {
    spawnRepairCreeps(spawn1);
  }
  // Only spawn builders if available energy is more than 85% of the container capacity
  else if (containerEnergyAvailable >= containerCap * 0.85) {
    spawnBuilders(spawn1);
  }


  for (const name in harvesters) {
    const creep = harvesters[name];
    runHarvester(creep);
  }

  for (const name in builders) {
    const creep = builders[name];
    runBuilder(creep);
  }

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

function spawnAdvancedHarvesters(spawn1: StructureSpawn) {
  let name = 'Harvester' + Game.time;
  let body = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE];
  let memory = { role: 'harvester', room: spawn1.room.name, harvesting: true };

  let memoryData = { name, body, memory };

  spawn1.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE], `Advanced Harvester-${Game.time}`, memoryData);
}

// spawn builders
function spawnBuilders(spawn1: StructureSpawn) {
  let name = 'Builder' + Game.time;
  let body = [WORK, CARRY, MOVE];
  let memory = { role: 'builder', room: spawn1.room.name, refueling: true };

  let memoryData = { name, body, memory };

  spawn1.spawnCreep([WORK, WORK, CARRY, CARRY, CARRY, MOVE], `Builder-${Game.time}`, memoryData);
}

// spawn repair creeps
function spawnRepairCreeps(spawn1: StructureSpawn) {
  let name = 'Repair' + Game.time;
  let body = [WORK, CARRY, MOVE];
  let memory = { role: 'repair', room: spawn1.room.name, refuelling: true };

  let memoryData = { name, body, memory };

  spawn1.spawnCreep([WORK, CARRY, CARRY, MOVE], `Repair-${Game.time}`, memoryData);
}

// TODO only deposit to containers if spawn and extension are full
function runHarvester(creep: Creep) {
  var spawnRefillTargets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    },
  });

  var stationTargets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_CONTAINER) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    },
  });

  var constructionTargets = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: (structure) => {
      return structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN;
    }
  });

  let availableTaskExists = (spawnRefillTargets.length > 0 || stationTargets.length > 0 || constructionTargets.length > 0 || creep.store[RESOURCE_ENERGY] == 0);

  if ((creep.memory.harvesting || availableTaskExists) && creep.store.getFreeCapacity() == 0) {
    creep.memory.harvesting = false;
    if (spawnRefillTargets.length > 0 || stationTargets.length > 0) {
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
    creep.memory.upgrading = false;
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
      creep.say('🔄 refill');

      if (spawnRefillTargets.length > 0) {
        if (creep.transfer(spawnRefillTargets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(spawnRefillTargets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
      else if (stationTargets.length > 0) {
        // refill stations
        if (creep.transfer(stationTargets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(stationTargets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
      else {
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

  if ((creep.memory.refueling || availableTaskExists) && creep.store.getFreeCapacity() == 0) {
    creep.memory.refueling = false;
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
    creep.memory.refueling = true;
  }

  let hasTask = (creep.memory.refueling || creep.memory.building || creep.memory.upgrading) ? true : false;

  if (hasTask) {
    if (creep.memory.refueling) {
      var stations = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          // Only fill at stations that have some energy
          return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] > 0;
        }
      });
      if (stations.length > 0) {
        creep.say('⛽ refuel');

        if (creep.withdraw(stations[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(stations[0], { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      } else {
        rally(creep);
      }
    }
    else if (creep.memory.building) {
      creep.say('🚧 build');
      if (constructionTargets.length > 0) {
        if (creep.build(constructionTargets[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(constructionTargets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
      } else {
        creep.memory.building = false;
        rally(creep);
      }
    } else if (creep.memory.upgrading) {
      creep.say('⚡ upgrade');
      if (creep.upgradeController(creep.room.controller!) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    }
  }
  else {
    // Only refuel again if we have no task
    if (creep.store.getFreeCapacity() > 0) {
      creep.memory.refueling = true;
    } else {
      rally(creep);
    }
  }
}

const maxWallHits = 10000;

function runRepairCreep(creep: Creep) {
  var wallTargets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return structure.structureType == STRUCTURE_WALL;
    }
  });

  var roadTargets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return structure.structureType == STRUCTURE_ROAD;
    }
  });

  let availableTaskExists = ((wallTargets.length > 0 || roadTargets.length > 0) || creep.store[RESOURCE_ENERGY] == 0);

  if ((creep.memory.refueling || availableTaskExists) && creep.store.getFreeCapacity() == 0) {
    creep.memory.refueling = false;
    if (wallTargets.length > 0) {
      creep.memory.repairing = true;
    } else {
      creep.memory.repairing = false;
    }
  }

  if ((creep.memory.repairing) && creep.store[RESOURCE_ENERGY] == 0) {
    creep.memory.repairing = false;
    creep.memory.refueling = true;
  }

  let hasTask = (creep.memory.refueling || creep.memory.repairing) ? true : false;

  if (hasTask) {
    if (creep.memory.refueling) {
      creep.say('⛽ refuel');
      var stations = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER;
        }
      });
      if (stations.length > 0) {
        if (creep.withdraw(stations[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(stations[0], { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    }
    else if (creep.memory.repairing) {
      if (wallTargets.length > 0) {
        for (let i = 0; i < wallTargets.length; i++) {
          var wall = wallTargets[i] as StructureWall;
          if (wall.hits < maxWallHits) {
            if (creep.repair(wallTargets[i]) == ERR_NOT_IN_RANGE) {
              creep.moveTo(wallTargets[i]);
            }
          }
        }
      } else if (roadTargets.length > 0) {
        for (let i = 0; i < roadTargets.length; i++) {
          var road = roadTargets[i] as StructureRoad;
          if (road.hits < road.hitsMax) {
            if (creep.repair(roadTargets[i]) == ERR_NOT_IN_RANGE) {
              creep.moveTo(roadTargets[i]);
            }
          }
        }
      }
    }
  } else {
    rally(creep);
  }
}


function rally(creep: Creep) {
  creep.moveTo(Game.flags.Rally1, { visualizePathStyle: { stroke: '#ffffff' } });
}
