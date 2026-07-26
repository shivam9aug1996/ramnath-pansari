import Head from "expo-router/head";

const APP_NAME = "Ramnath Pansari";

type AppHeadProps = {
  title: string;
  description?: string;
};

export default function AppHead({ title, description }: AppHeadProps) {
  const safeTitle = title?.trim() || APP_NAME;
  const fullTitle =
    title === APP_NAME || safeTitle.startsWith(`${APP_NAME}`)
      ? title
      : `${title} | ${APP_NAME}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
    </Head>
  );
}
