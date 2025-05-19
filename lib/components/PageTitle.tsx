interface PageTitleProps {
  title: string;
  description: string;
}

function PageTitle(props: PageTitleProps) {
  return (
    <span>
      {props.title} <span className="onyx-text-pink">|</span>{" "}
      <span className="text-muted">{props.description}</span>
    </span>
  );
}

export default PageTitle;
