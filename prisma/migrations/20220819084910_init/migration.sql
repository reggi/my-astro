-- CreateTable
CREATE TABLE "Calendar" (
    "id" SERIAL NOT NULL,
    "blob" JSONB NOT NULL,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);
