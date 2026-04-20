import { deleteSession } from "@/modules/auth/application/session.service";

export async function logoutUseCase(rawToken: string): Promise<void> {
  await deleteSession(rawToken);
}
