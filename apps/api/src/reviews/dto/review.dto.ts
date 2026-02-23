import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
    @IsString()
    booking!: string;

    @IsString()
    reviewee!: string;

    @IsEnum(['owner', 'renter'])
    revieweeType!: 'owner' | 'renter';

    @IsInt()
    @Min(1)
    @Max(5)
    overallRating!: number;

    @IsInt()
    @Min(1)
    @Max(5)
    communication!: number;

    @IsInt()
    @Min(1)
    @Max(5)
    punctuality!: number;

    @IsOptional()
    @IsString()
    comment?: string;
}
