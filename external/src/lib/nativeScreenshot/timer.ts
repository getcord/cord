type StepTimes<Step extends string> = {
  [step in Step]: number;
};

export class Timer<Step extends string> {
  private timesTaken: Partial<StepTimes<Step>> = {};
  private startTimes: { [step: string]: number } = {};

  // Return 0 and warn if step is not in timesTaken
  get times(): { [step in Step]: number } {
    return new Proxy(this.timesTaken as StepTimes<Step>, {
      get: (target, prop: Step): number => {
        if (target[prop] === undefined) {
          console.warn(
            `Tried to access undefined time from Timer. Step: ${prop}`,
          );
          return 0;
        } else {
          return target[prop];
        }
      },
    });
  }

  start(...steps: Step[]) {
    const time = performance.now();
    for (const step of steps) {
      this.startTimes[step] = time;
    }
  }

  stop(...steps: Step[]) {
    for (const step of steps) {
      if (!this.startTimes[step]) {
        console.warn(`No start time recorded for ${step}`);
        continue;
      }
      this.timesTaken[step] = Math.round(
        performance.now() - this.startTimes[step],
      );
    }
  }
}
