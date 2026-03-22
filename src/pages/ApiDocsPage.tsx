const ApiDocsPage = () => {
  const docsUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/api-docs`;

  return (
    <div className="w-full h-screen">
      <iframe
        src={docsUrl}
        className="w-full h-full border-0"
        title="API Documentation"
      />
    </div>
  );
};

export default ApiDocsPage;
