import type * as RDF from '@rdfjs/types';

/**
 * A helper class for tracking resources of a given type.
 *
 * It allows resources of a given type to be mapped to a certain value.
 */
export class ResourceIdentifier<T> {
  private readonly type: RegExp;
  private readonly targetPredicate: RegExp;

  public readonly buffer: Record<string, IResource>;
  public readonly resourceMapping: Record<string, T>;

  public constructor(
    typeRegex: string,
    targetPredicateRegex: string,
  ) {
    this.type = new RegExp(typeRegex, 'u');
    this.targetPredicate = new RegExp(targetPredicateRegex, 'u');

    this.buffer = {};
    this.resourceMapping = {};
  }

  /**
   * Check if the subject of the given quad occurs within the buffer as a resource.
   * @param quad A quad
   * @param allowedComponent The quad component on which transformation is allowed.
   *                         If undefined, then all components must be considered.
   */
  public isQuadBuffered(quad: RDF.Quad, allowedComponent?: 'subject' | 'object'): boolean {
    return Boolean(((!allowedComponent || allowedComponent === 'subject') &&
        quad.subject.termType === 'NamedNode' && this.buffer[quad.subject.value]) ||
      ((!allowedComponent || allowedComponent === 'object') &&
        quad.object.termType === 'NamedNode' && this.buffer[quad.object.value]));
  }

  /**
   * Return the buffer entry for the given subject resource.
   * @param quad A quad
   */
  public getBufferResource(quad: RDF.Quad): IResource {
    if (quad.subject.termType === 'NamedNode' && this.buffer[quad.subject.value]) {
      return this.buffer[quad.subject.value];
    }
    return this.buffer[quad.object.value];
  }

  /**
   * Check if the subject resource is of the expected type, and if so, initialize a buffer entry for it.
   * @param quad A quad
   * @return boolean True if the buffer was initialized.
   */
  public tryInitializingBuffer(quad: RDF.Quad): boolean {
    if (quad.subject.termType === 'NamedNode' &&
      quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
      quad.object.termType === 'NamedNode' && this.type.test(quad.object.value)) {
      this.buffer[quad.subject.value] = { quads: [ quad ], type: quad.object };

      return true;
    }
    return false;
  }

  /**
   * If the quad's predicate matches with the expected predicate, store it within the resource.
   * @param resource A resource.
   * @param quad A quad.
   * @return boolean True if the target was set.
   */
  public tryStoringTarget(resource: IResource, quad: RDF.Quad): boolean {
    // Append the full quad
    resource.quads.push(quad);

    // Try to set the target
    if (this.targetPredicate.test(quad.predicate.value)) {
      if (quad.object.termType !== 'NamedNode') {
        throw new Error(`Expected target value of type NamedNode on resource '${quad.subject.value}'`);
      }
      if (resource.target) {
        throw new Error(`Illegal overwrite of target value on resource '${quad.subject.value}'`);
      }
      resource.target = quad.object;

      return true;
    }

    return false;
  }

  /**
   * If the subject or object in the given quad was mapped, invoke the given callback for them.
   * @param quad A quad.
   * @param callback A callback.
   * @return boolean True if at least one of the subject or object components were matched.
   */
  public forEachMappedResource(
    quad: RDF.Quad,
    callback: (mapping: T, component: 'subject' | 'object') => void,
  ): boolean {
    let atLeastOne = false;
    if (quad.subject.termType === 'NamedNode' && this.resourceMapping[quad.subject.value]) {
      // eslint-disable-next-line callback-return
      callback(this.resourceMapping[quad.subject.value], 'subject');
      atLeastOne = true;
    }
    if (quad.object.termType === 'NamedNode' && this.resourceMapping[quad.object.value]) {
      // eslint-disable-next-line callback-return
      callback(this.resourceMapping[quad.object.value], 'object');
      atLeastOne = true;
    }
    return atLeastOne;
  }

  /**
   * Remove the buffer entry for the given resource subject, and store the given mapping for it.
   * @param quad A quad.
   * @param mapping A mapping value to set.
   */
  public applyMapping(quad: RDF.Quad, mapping: T): void {
    delete this.buffer[quad.subject.value];
    this.resourceMapping[quad.subject.value] = mapping;
  }

  /**
   * This should be invoked when transformers end.
   */
  public onEnd(): void {
    // After processing is done, check if buffer is clear
    if (Object.keys(this.buffer).length > 0) {
      throw new Error(`Detected non-finalized resources in the buffer: ${Object.keys(this.buffer)}`);
    }
  }
}

export interface IResource {
  id?: RDF.Term;
  target?: RDF.NamedNode;
  quads: RDF.Quad[];
  type: RDF.NamedNode;
}
