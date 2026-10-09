// @ts-expect-error: TS6133
const AAA = (props) => {
  console.log('Received props:', props);
  const name = props.container.getAttribute('name')
  const age = props.container.getAttribute('age')
  return (
    <div>dfadsfsdf
      {/* <p>Name: {props.name}</p> */}
      {/* <p>Name: {name}</p> */}
      {/* <p>AGE: {age}</p> */}
    </div>
  );
}

export default AAA