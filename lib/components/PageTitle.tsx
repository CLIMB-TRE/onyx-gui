interface PageTitleProps {
  title: string;
  description: string;
  noTruncate?: boolean;
}

function PageTitle(props: PageTitleProps) {
  const title = `${props.title} | ${props.description}`;

  return (
    <span className={!props.noTruncate ? "text-truncate" : ""} title={title}>
      {props.title} <span className="onyx-text-pink">|</span>{" "}
      <span className="text-muted">{props.description}</span>
    </span>
  );
}

export default PageTitle;
