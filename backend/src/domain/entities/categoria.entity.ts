export interface CategoriaProps {
  idCategoria: number;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

export class Categoria {
  readonly idCategoria: number;
  readonly nombre: string;
  readonly descripcion: string;
  readonly activa: boolean;

  constructor(props: CategoriaProps) {
    this.idCategoria = props.idCategoria;
    this.nombre = props.nombre;
    this.descripcion = props.descripcion;
    this.activa = props.activa;
  }
}
