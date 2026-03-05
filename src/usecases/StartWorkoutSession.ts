import {
  ConflictError,
  NotFoundError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

interface OutputDto {
  userWorkoutSessionId: string;
}

export class StartWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutDay = await prisma.workoutDay.findFirst({
      where: {
        id: dto.workoutDayId,
        workoutPlanId: dto.workoutPlanId,
      },
      include: {
        workoutPlan: true,
        sessions: true,
      },
    });

    if (!workoutDay) {
      throw new NotFoundError("Workout day not found");
    }

    if (workoutDay.workoutPlan.userId !== dto.userId) {
      throw new NotFoundError("Workout day not found");
    }

    if (!workoutDay.workoutPlan.isActive) {
      throw new WorkoutPlanNotActiveError("Workout plan is not active");
    }

    const hasStartedSession = workoutDay.sessions.some(
      (session) => session.startedAt,
    );

    if (hasStartedSession) {
      throw new ConflictError(
        "This workout day already has a started session",
      );
    }

    const session = await prisma.workoutSession.create({
      data: {
        workoutDayId: dto.workoutDayId,
        startedAt: new Date(),
      },
    });

    return {
      userWorkoutSessionId: session.id,
    };
  }
}
