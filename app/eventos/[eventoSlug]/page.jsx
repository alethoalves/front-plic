const Page = ({ params }) => {
  return (
    <main>
      <p>Vocês está no evento: {params.eventoSlug}</p>
    </main>
  );
};

export default Page;
