-- CreateTable
CREATE TABLE "HomePage" (
    "id" TEXT NOT NULL DEFAULT 'home',
    "heroVideoUrl" TEXT,
    "heroPosterUrl" TEXT,
    "editorial" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePage_pkey" PRIMARY KEY ("id")
);
