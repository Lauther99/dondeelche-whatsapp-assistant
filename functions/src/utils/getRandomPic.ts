export const getRandomPic = (): string => {
    const avatars = [
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831612312.png?alt=media&token=48fef4d1-4b1b-47d6-a708-34504a2a8f3d",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831610128.png?alt=media&token=3e3138ed-0a87-4d44-9c52-8210a5338a2b",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831608145.png?alt=media&token=44932720-8795-456e-bc08-48adfb258de4",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831606522.png?alt=media&token=9f971e72-3650-45c0-985c-82ce83bbf2ea",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831604813.png?alt=media&token=d7721a8b-9879-4ae4-8f70-1166ac753c35",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831601340.png?alt=media&token=3ab02dc0-8167-40e6-a547-a58306335d9e",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831599539.png?alt=media&token=126fc510-7c1f-41b9-b1bc-02c656835587",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831597604.png?alt=media&token=e3cbc1e5-ce0c-4978-b458-8821476d527c",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831594890.png?alt=media&token=27c020a3-8085-452f-be80-b596bea0afa5",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831592797.png?alt=media&token=8e5ad4ec-c4c3-4ade-ae3e-570b0829399c",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831590257.png?alt=media&token=01f37ec3-47a2-44cd-8592-69e6846d4bb9",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831588242.png?alt=media&token=5cd5af5a-b6df-419e-bb41-bf7d69b9a8b4",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831585498.png?alt=media&token=ecd93eef-da76-4c45-acd3-27413f303ddd",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831582876.png?alt=media&token=c4cc0eff-685b-4382-b3d9-7b2de023ed5b",
        "https://firebasestorage.googleapis.com/v0/b/dondeelche-bot-stage.appspot.com/o/avatars%2Fidenticon-1704831577996.png?alt=media&token=2f07c5b4-50d4-4f07-bc0a-eefd8deaa767"
    ]
    const position = getRandomNumber(0, avatars.length);
    return avatars[position];
};

function getRandomNumber(min: number, max: number): number {
    const randomDecimal = Math.random();
    const difference = max - min;
    const randomNumberInRange = Math.floor(randomDecimal * difference) + min;
    return randomNumberInRange;
}
