export class GetTopLeaderboardQuery {
  constructor(
    public readonly division: string,
    public readonly seasonId: string,
    public readonly limit: number = 50,
  ) {}
}
