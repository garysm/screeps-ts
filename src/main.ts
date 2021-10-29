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
  const upgraders: Creep[] = _.filter(myCreeps, (creep) => creep.memory.role == "upgrader");

  const spawn1 = Game.spawns["Spawn1"];

  if (harvesters.length < 6) {
    spawnHarvesters(spawn1);
  }

  if (builders.length < 2) {
    spawnBuilders(spawn1);
  }

  if (upgraders.length < 2) {
    spawnUpgraders(spawn1);
  }

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

  //run for each upgrader
  for (const name in upgraders) {
    const creep = upgraders[name];
    runUpgrader(creep);
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

  spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], `Harvester-${Game.time}`, memoryData);
}

// spawn builders
function spawnBuilders(spawn1: StructureSpawn) {
  let name = 'Builder' + Game.time;
  let body = [WORK, CARRY, MOVE];
  let memory = { role: 'builder', room: spawn1.room.name };

  let memoryData = { name, body, memory };

  spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], `Builder-${Game.time}`, memoryData);
}

// spawn upgraders
function spawnUpgraders(spawn1: StructureSpawn) {
  let name = 'Upgrader' + Game.time;
  let body = [WORK, CARRY, MOVE];
  let memory = { role: 'upgrader', room: spawn1.room.name };

  let memoryData = { name, body, memory };

  spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], `Upgrader-${Game.time}`, memoryData);
}


function runHarvester(creep: Creep) {
  var refillTargets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    },
  });
  var constructionTargets = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: (structure) => {
      return structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN;
    }
  });
  if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
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

  if (creep.memory.harvesting) {
    creep.say('⛏ harvest');
    var sources = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    if (sources != null) {
      if (creep.harvest(sources) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    }
  }

  if (creep.memory.refilling) {
    var refillTargets = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    });
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

  if (creep.memory.building) {
    creep.say('🚧 build');
    var constructionTargets = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN;
      }
    });
    if (constructionTargets.length) {
      if (creep.build(constructionTargets[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(constructionTargets[0], { visualizePathStyle: { stroke: '#ffffff' } });
      }
    }
  }
}

function rally(creep: Creep) {
  creep.moveTo(Game.flags.Rally1, { visualizePathStyle: { stroke: '#ffffff' } });
}

// run builders
function runBuilder(creep: Creep) {

  if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
    creep.memory.building = false;
  }
  if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
    creep.memory.building = true;
  }
  if (creep.memory.building) {
    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (targets.length) {
      if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
      }
    }
  }
  else {
    var sources = creep.room.find(FIND_SOURCES);
    if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
      creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
    } else {
      // rally(creep);
    }
  }
}

//  run upgraders
function runUpgrader(creep: Creep) {
  if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0 || creep.room.controller === undefined || !creep.room.controller.my) {
    creep.memory.upgrading = false;
  }
  if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
    creep.memory.upgrading = true;
  }

  if (creep.memory.upgrading) {
    if (creep.upgradeController(creep.room.controller!) == ERR_NOT_IN_RANGE) {
      creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }
  else {
    var sources = creep.room.find(FIND_SOURCES);
    if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
      creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
    } else {
      // rally(creep);
    }
  }
}
