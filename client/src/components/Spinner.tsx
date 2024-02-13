import spinner from '../assets/spinner.svg'
type Props = {
  classs?: string
}

export const Spinner = ({classs}: Props) =>  <img className={classs || 'w-7 h-7 inline'} src={spinner} />