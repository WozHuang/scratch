export async function delay(wait: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, wait));
}
