import { CreepTask } from "creep_room_controller";

export class CreepTaskController {

    public static assignTask(creep: Creep, task: CreepTask): void {
        creep.memory.currentTask = task;
    }

    public static getTask(creep: Creep): CreepTask {
        return creep.memory.currentTask;
    }

    // run task
    public static runTask(creep: Creep): void {
        const task = this.getTask(creep);
        switch (task) {
            case CreepTask.Initialize:
                this.initialize(creep);
                break;
            case CreepTask.Harvest:
                this.runHarvestTask(creep);
                break;
            case CreepTask.Build:
                this.runBuildTask(creep);
                break;
            case CreepTask.Refill:
                this.runRefillTask(creep);
                break;
            case CreepTask.Refuel:
                this.runRefuelTask(creep);
                break;
            case CreepTask.Upgrade:
                this.runUpgradeTask(creep);
                break;
            case CreepTask.Repair:
                this.runRepairTask(creep);
                break;
            case CreepTask.Idle:
                this.runIdleTask(creep);
                break;
            case CreepTask.Rally:
                this.runRallyTask(creep);
                break;
            default:
                break;
        }
    }

    private static initialize(creep: Creep): void {
        // if (creep.memory.currentTask == null) {
        //     creep.memory.currentTask = CreepTask.Harvest;
        // }
    }

    private static runHarvestTask(creep: Creep): void {
        var sources = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (sources != null) {
            if (creep.harvest(sources) == ERR_NOT_IN_RANGE) {
                creep.say('⛏ harvest');

                creep.moveTo(sources, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }

    private static runBuildTask(creep: Creep, filters?: Array<String>): void {
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);

        if (filters != null) {
            targets = targets.filter(function (target) {
                return filters.includes(target.structureType);
            });
        }

        if (targets.length) {
            if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.say('🚧 build');

                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }

    private static runRefillTask(creep: Creep): void {
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE) &&
                    structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
            }
        });

        if (targets.length > 0) {
            if (creep.withdraw(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.say('🔋 refill');

                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }

    // run refuel task
    public static runRefuelTask(creep: Creep): void {
        var stations = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER;
            }
        });
        if (stations.length > 0) {
            if (creep.withdraw(stations[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.say('🔋 refuel');

                creep.moveTo(stations[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }

    private static runUpgradeTask(creep: Creep): void {
        var controller = creep.room.controller;
        if (controller != null) {
            if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
                creep.say('⚡ upgrade');

                creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }

    private static runRepairTask(creep: Creep, filters?: Array<String>): void {
        var targets = creep.room.find(FIND_STRUCTURES);
        if (filters != null) {
            targets = targets.filter(function (target) {
                return filters.includes(target.structureType);
            });
        }

        if (targets.length) {
            if (creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.say('🔧 repair');

                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }

    private static runIdleTask(creep: Creep): void {
        creep.say('💤 idle');
    }

    private static runRallyTask(creep: Creep): void {
        creep.moveTo(Game.flags.Rally1, { visualizePathStyle: { stroke: '#ffffff' } });
    }
}
