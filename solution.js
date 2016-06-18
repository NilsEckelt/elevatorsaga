{
    init: function(elevators, floors) {
        var calls = {
            up: [],
            down: [],
            getHighestDown: function() {
                return (calls.down.length > 0) ? calls.down.sort(function(a, b) {return a-b;}).pop() : null;
            },
            getLowestUp: function() {
                return (calls.up.length > 0) ? calls.up.sort(function(a, b) {return b-a;}).pop() : null;
            },
        }
        elevators.forEach(function(elevator, i) {
            elevator.isDestination = function(floor) { return this.destinationQueue.includes(floor); };
            elevator.updateLights = function() {
                var queue = [].concat(this.destinationQueue);
                var top = queue.sort(function(a, b) {return a-b;}).pop();
                this.goingUpIndicator(this.destinationDirection() !== "down" || this.currentFloor <= 1);
                this.goingDownIndicator(this.destinationDirection() !== "up");
            };

            elevator.updateLights();
            elevator.on("floor_button_pressed", function(floorNum) {
                elevator.goToFloor(floorNum);
            });
            elevator.on("stopped_at_floor", function(floor) {
                elevator.destinationQueue = elevator.destinationQueue.filter(function(f) {return f!== elevator.currentFloor();})
                elevator.checkDestinationQueue();
                elevator.updateLights();
                if(i===0) {
                    console.log(i, elevator.currentFloor(), elevator.destinationQueue);
                }
            });
            elevator.on("idle", function(floor) {
                elevator.goingUpIndicator(false);
                elevator.goingDownIndicator(false);
                var nextFloor = calls.getHighestDown() || calls.getLowestUp();
                if (nextFloor) {
                    elevator.goToFloor(nextFloor);
                }
            });
            elevator.on("passing_floor", function(floor, direction) {
                elevator.updateLights();
                // stop for every passengers destination
                if (elevator.destinationQueue.includes(floor)) {
                    elevator.goToFloor(floor, true);
                    elevator.destinationQueue = elevator.destinationQueue.filter(function(f) {return elevator.destinationQueue.includes(f)});
                    elevator.checkDestinationQueue();
                }
                //pick people up on your way
                if (elevator.loadFactor() < .6) {
                    if (direction === 'up') {
                        if (calls.up.includes(floor)) {
                            elevator.goToFloor(floor, true);
                            calls.up = calls.up.filter(function(f) {return f!==floor});
                        }
                    } else {
                        if (calls.down.includes(floor)) {
                            elevator.goToFloor(floor, true);
                            calls.down = calls.down.filter(function(f) {return f!==floor});
                        }
                    }
                }
            });
        });

        floors.forEach(function(floor, i) {
            function findIdle() {
                return elevators.find(function(e) {return e.destinationQueue.length === 0;});
            }
            floor.on("up_button_pressed ", function (floor) {
                var idle = findIdle();
                if (idle) {
                    idle.goToFloor(floor.floorNum());
                } else {
                    if (!calls.up.includes(floor.floorNum())) {
                        calls.up.push(floor.floorNum());
                    }
                }
            });
            floor.on("down_button_pressed ", function (floor) {
                var idle = findIdle();
                if (idle) {
                    idle.goToFloor(floor.floorNum());
                } else {
                    if (!calls.down.includes(floor.floorNum())) {
                        calls.down.push(floor.floorNum())
                    }
                }
            });
        });
    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}
