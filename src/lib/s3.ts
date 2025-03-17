export const getS3Url = (key: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL;
  return `${baseUrl}/${key}`;
}; 