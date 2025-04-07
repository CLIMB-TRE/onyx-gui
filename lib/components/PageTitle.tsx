interface PageTitleProps {
  title: string;
  projectDescription: string;
}

function PageTitle(props: PageTitleProps) {
  return (
    <span>
      {props.title} <span className="onyx-text-pink">|</span>{" "}
      <span className="text-muted">{props.projectDescription}</span>
    </span>
  );
}

export default PageTitle;
